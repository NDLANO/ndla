/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, utimes, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { launch, prune } from "../nx-cache-server.mts";

const run = promisify(execFile);
const script = fileURLToPath(new URL("../nx-cache-server.mts", import.meta.url));
const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN = "test-token";
const auth = { authorization: `Bearer ${TOKEN}` };

let dir: string;
let store: string;
const pids: number[] = [];

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "nx-cache-server-"));
  store = join(dir, "store");
  await mkdir(store);
});

afterEach(async () => {
  for (const pid of pids.splice(0)) process.kill(pid);
  await rm(dir, { recursive: true, force: true });
});

/** These tests may themselves run under nx, whose variables would leak into the processes they start. */
const withoutNx = (): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("NX_")));

const serve = async (root = store): Promise<string> => {
  const { port, pid } = await launch(root, TOKEN, join(dir, "server.log"));
  pids.push(pid);
  return `http://127.0.0.1:${port}`;
};

const put = (url: string, body: string, headers: Record<string, string> = auth): Promise<Response> =>
  fetch(url, { method: "PUT", headers, body });

/** Sends `path` as is, where `fetch` would normalise away any `..` segments. */
const rawStatus = (origin: string, path: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const { hostname, port } = new URL(origin);
    request({ hostname, port, path, headers: auth }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    })
      .on("error", reject)
      .end();
  });

describe("prune", () => {
  const entry = async (name: string, bytes: number, daysAgo: number): Promise<void> => {
    const path = join(store, name);
    await writeFile(path, Buffer.alloc(bytes));
    const time = new Date(Date.now() - daysAgo * DAY_MS);
    await utimes(path, time, time);
  };

  it("removes interrupted uploads and records unused for a week", async () => {
    await entry("1", 10, 0);
    await entry("2", 10, 8);
    await entry("3.tmp-abc", 10, 0);
    expect(await prune(store, 1024)).toEqual({ kept: 1, removed: 2, bytes: 10 });
    expect(await readdir(store)).toEqual(["1"]);
  });

  it("evicts the least recently used records until the store fits", async () => {
    await entry("1", 400, 3);
    await entry("2", 400, 2);
    await entry("3", 400, 1);
    expect(await prune(store, 1000)).toEqual({ kept: 2, removed: 1, bytes: 800 });
    expect((await readdir(store)).sort()).toEqual(["2", "3"]);
  });
});

describe("server", () => {
  it("serves uploaded records", async () => {
    const origin = await serve();
    expect((await put(`${origin}/v1/cache/123`, "artifact")).status).toBe(200);
    const res = await fetch(`${origin}/v1/cache/123`, { headers: auth });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(await res.text()).toBe("artifact");
  });

  it("answers a missing record with 404", async () => {
    const origin = await serve();
    expect((await fetch(`${origin}/v1/cache/123`, { headers: auth })).status).toBe(404);
  });

  it("refuses to override an existing record", async () => {
    const origin = await serve();
    expect((await put(`${origin}/v1/cache/123`, "first")).status).toBe(200);
    expect((await put(`${origin}/v1/cache/123`, "second")).status).toBe(409);
    expect(await readFile(join(store, "123"), "utf8")).toBe("first");
  });

  it("requires the token", async () => {
    const origin = await serve();
    const wrong = { authorization: "Bearer wrong" };
    expect((await fetch(`${origin}/v1/cache/123`)).status).toBe(401);
    expect((await fetch(`${origin}/v1/cache/123`, { headers: wrong })).status).toBe(401);
    expect((await put(`${origin}/v1/cache/123`, "artifact", wrong)).status).toBe(401);
    expect(await readdir(store)).toEqual([]);
  });

  it("only serves records inside the store", async () => {
    const origin = await serve();
    await writeFile(join(dir, "secret"), "secret");
    expect(await rawStatus(origin, "/v1/cache/../../secret")).toBe(404);
    expect(await rawStatus(origin, "/v1/cache/..%2F..%2Fsecret")).toBe(404);
    expect(await rawStatus(origin, "/v1/cache/123/../../../secret")).toBe(404);
  });

  it("only supports GET and PUT", async () => {
    const origin = await serve();
    expect((await fetch(`${origin}/v1/cache/123`, { method: "DELETE", headers: auth })).status).toBe(405);
  });

  it("marks served records as recently used", async () => {
    const origin = await serve();
    await put(`${origin}/v1/cache/123`, "artifact");
    const weekAgo = new Date(Date.now() - 6 * DAY_MS);
    await utimes(join(store, "123"), weekAgo, weekAgo);
    await (await fetch(`${origin}/v1/cache/123`, { headers: auth })).text();
    expect((await stat(join(store, "123"))).mtimeMs).toBeGreaterThan(Date.now() - DAY_MS);
  });

  it("answers store failures with statuses nx tolerates", async () => {
    const notADirectory = join(dir, "not-a-directory");
    await writeFile(notADirectory, "");
    const origin = await serve(notADirectory);
    expect((await put(`${origin}/v1/cache/123`, "artifact")).status).toBe(403);
    expect((await fetch(`${origin}/v1/cache/123`, { headers: auth })).status).toBe(404);
  });
});

describe("start", () => {
  it("warns and exports nothing when the server cannot start", async () => {
    const githubEnv = join(dir, "github-env");
    const { stdout } = await run(process.execPath, [script, "start"], {
      env: { ...withoutNx(), NX_CACHE_STORE: "", GITHUB_ENV: githubEnv },
    });
    expect(stdout).toContain("::warning::nx cache server not started");
    await expect(stat(githubEnv)).rejects.toThrow();
  });
});

describe("with nx", () => {
  const writeJson = async (path: string, value: unknown): Promise<void> => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(value));
  };

  const buildScript = `
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const dist = join(import.meta.dirname, "dist");
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, "out.txt"), "built");
console.log("building app");
`;

  it("restores task results that another runner uploaded", async () => {
    const nx = dirname(createRequire(import.meta.url).resolve("nx/package.json"));
    const workspace = join(dir, "workspace");
    await writeJson(join(workspace, "package.json"), { name: "fixture", private: true, workspaces: ["packages/*"] });
    await writeJson(join(workspace, "nx.json"), { analytics: false });
    await writeJson(join(workspace, "packages/app/package.json"), {
      name: "app",
      nx: {
        targets: {
          build: { command: "node packages/app/build.mjs", cache: true, outputs: ["{projectRoot}/dist"] },
        },
      },
    });
    await writeFile(join(workspace, "packages/app/build.mjs"), buildScript);
    await mkdir(join(workspace, "node_modules"));
    await symlink(nx, join(workspace, "node_modules/nx"));

    const githubEnv = join(dir, "github-env");
    const log = join(dir, "nx-cache-server.log");
    await run(process.execPath, [script, "start"], {
      env: { ...withoutNx(), NX_CACHE_STORE: store, GITHUB_ENV: githubEnv, GITHUB_STEP_SUMMARY: "", RUNNER_TEMP: dir },
    });
    pids.push(Number(/\(pid (\d+)\)/.exec(await readFile(log, "utf8"))?.[1]));
    const exported = Object.fromEntries(
      (await readFile(githubEnv, "utf8"))
        .trim()
        .split("\n")
        .map((line) => line.split("=", 2)),
    );

    const build = (runner: string) =>
      run(process.execPath, [join(nx, "dist/bin/nx.js"), "run", "app:build", "--outputStyle=static"], {
        cwd: workspace,
        env: {
          ...withoutNx(),
          ...exported,
          NX_CACHE_DIRECTORY: join(dir, runner, "cache"),
          NX_WORKSPACE_DATA_DIRECTORY: join(dir, runner, "data"),
          NX_DAEMON: "false",
          NX_NO_CLOUD: "true",
          NX_TUI: "false",
        },
      });
    const output = join(workspace, "packages/app/dist/out.txt");

    const first = await build("runner-1");
    expect(first.stdout).not.toContain("[remote cache]");
    expect(await readdir(store)).toHaveLength(1);

    await rm(dirname(output), { recursive: true });
    const second = await build("runner-2");
    expect(second.stdout).toContain("[remote cache]");
    expect(second.stdout).toContain("building app");
    expect(await readFile(output, "utf8")).toBe("built");
    expect(await readFile(log, "utf8")).toMatch(/PUT \/v1\/cache\/\d+ 200[\s\S]*GET \/v1\/cache\/\d+ 200/);
  });
});
