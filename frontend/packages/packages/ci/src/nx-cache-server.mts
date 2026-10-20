/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, createWriteStream, openSync } from "node:fs";
import { mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { env, log, report, setEnv, warning } from "./github.mts";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_BYTES = 1024 ** 3;
const READY_TIMEOUT_MS = 10_000;
const ENTRY_PATH = /^\/v1\/cache\/([A-Za-z0-9]+)$/;
const TEMP_MARKER = ".tmp-";

type Entry = { path: string; size: number; mtimeMs: number };

/** Drops leftovers and stale entries, then the least recently used ones until the store fits `maxBytes`. */
const prune = async (store: string, maxBytes: number): Promise<{ kept: number; removed: number; bytes: number }> => {
  const now = Date.now();
  const entries: Entry[] = [];
  let removed = 0;
  for (const name of await readdir(store)) {
    const path = join(store, name);
    const { size, mtimeMs } = await stat(path);
    if (name.includes(TEMP_MARKER) || now - mtimeMs > MAX_AGE_MS) {
      await rm(path, { force: true, recursive: true });
      removed++;
    } else {
      entries.push({ path, size, mtimeMs });
    }
  }

  let bytes = 0;
  let kept = 0;
  for (const entry of entries.sort((a, b) => b.mtimeMs - a.mtimeMs)) {
    if (bytes + entry.size > maxBytes) {
      await rm(entry.path, { force: true, recursive: true });
      removed++;
    } else {
      bytes += entry.size;
      kept++;
    }
  }
  return { kept, removed, bytes };
};

const reply = (res: ServerResponse, status: number, message: string): void => {
  res.writeHead(status, { "content-type": "text/plain" }).end(message);
};

const download = async (path: string, res: ServerResponse): Promise<void> => {
  const file = await open(path).catch(() => undefined);
  if (!file) return reply(res, 404, "The record was not found");
  try {
    const { size } = await file.stat();
    // Pruning evicts by mtime, so a hit marks the entry as recently used.
    const now = new Date();
    await file.utimes(now, now);
    res.writeHead(200, { "content-type": "application/octet-stream", "content-length": size });
    await pipeline(file.createReadStream({ autoClose: false }), res);
  } finally {
    await file.close();
  }
};

const exists = async (path: string): Promise<boolean> => (await stat(path).catch(() => undefined)) !== undefined;

const upload = async (path: string, req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (await exists(path)) return reply(res, 409, "Cannot override an existing record");
  const expected = Number(req.headers["content-length"]);
  const temp = `${path}${TEMP_MARKER}${randomBytes(6).toString("hex")}`;
  try {
    await pipeline(req, createWriteStream(temp));
    const { size } = await stat(temp);
    if (size !== expected) throw new Error(`Expected ${expected} bytes, received ${size}`);
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
  reply(res, 200, "Successfully uploaded");
};

const handle = async (store: string, token: string, req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (req.headers.authorization !== `Bearer ${token}`) return reply(res, 401, "Missing or invalid token");
  const hash = ENTRY_PATH.exec(req.url ?? "")?.[1];
  if (!hash) return reply(res, 404, "Not found");
  const path = join(store, hash);
  if (req.method === "GET") return download(path, res);
  if (req.method === "PUT") return upload(path, req, res);
  res.setHeader("allow", "GET, PUT");
  reply(res, 405, "Method not allowed");
};

const serve = (store: string, token: string): void => {
  // Nx fails every remaining task once the server is gone, so stay up and log instead.
  process.on("uncaughtException", (error) => log(`Uncaught: ${error.stack}`));
  const server = createServer((req, res) => {
    res.on("finish", () => log(`${req.method} ${req.url} ${res.statusCode}`));
    handle(store, token, req, res).catch((error: unknown) => {
      log(`${req.method} ${req.url} failed: ${error instanceof Error ? error.stack : String(error)}`);
      if (res.headersSent) res.destroy();
      // Nx fails the run on a 5xx, but treats a 404 as a miss and a 403 on upload as a read-only cache.
      else reply(res, req.method === "PUT" ? 403 : 404, "The cache store failed, see the server log");
    });
  });
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    log(`Listening on 127.0.0.1:${port}, serving ${store}`);
    process.send?.({ port });
  });
};

/** Starts `serve` detached, so the server outlives this step and keeps running for the rest of the job. */
const launch = (store: string, token: string, logFile: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const out = openSync(logFile, "a");
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "serve"], {
      detached: true,
      stdio: ["ignore", out, out, "ipc"],
      env: { ...process.env, NX_CACHE_STORE: store, NX_CACHE_SERVER_TOKEN: token },
    });
    closeSync(out);
    const fail = (reason: string): void => {
      clearTimeout(timer);
      child.kill();
      reject(new Error(`${reason}, see ${logFile}`));
    };
    const timer = setTimeout(() => fail(`No response within ${READY_TIMEOUT_MS / 1000}s`), READY_TIMEOUT_MS);
    child.once("error", (error) => fail(error.message));
    child.once("exit", (code) => fail(`Exited with code ${code}`));
    child.once("message", (message: { port?: number }) => {
      clearTimeout(timer);
      child.removeAllListeners("exit").removeAllListeners("error");
      child.disconnect();
      child.unref();
      if (message.port) resolve(message.port);
      else reject(new Error(`Did not report a port, see ${logFile}`));
    });
  });

const start = async (): Promise<void> => {
  const store = env("NX_CACHE_STORE");
  if (!store) throw new Error("NX_CACHE_STORE is not set");
  await mkdir(store, { recursive: true });
  const maxBytes = Number(env("NX_CACHE_STORE_MAX_BYTES") || DEFAULT_MAX_BYTES);
  const { kept, removed, bytes } = await prune(store, maxBytes);

  const logFile = join(env("RUNNER_TEMP") || tmpdir(), "nx-cache-server.log");
  const token = randomBytes(32).toString("hex");
  const port = await launch(store, token, logFile);

  log(`::add-mask::${token}`);
  setEnv("NX_SELF_HOSTED_REMOTE_CACHE_SERVER", `http://127.0.0.1:${port}`);
  setEnv("NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN", token);
  report(`nx cache server listening on 127.0.0.1:${port} with ${kept} cached task(s)`, [
    `store: ${store}`,
    `kept ${kept} entries (${(bytes / 1024 ** 2).toFixed(1)} MiB), pruned ${removed}`,
    `log: ${logFile}`,
  ]);
};

const mode = process.argv[2];
if (mode === "serve") {
  serve(env("NX_CACHE_STORE"), env("NX_CACHE_SERVER_TOKEN"));
} else if (mode === "start") {
  await start().catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error);
    warning(`nx cache server not started, running without a shared cache: ${reason}`);
  });
} else {
  process.stderr.write("Usage: node nx-cache-server.mts start\n");
  process.exitCode = 1;
}
