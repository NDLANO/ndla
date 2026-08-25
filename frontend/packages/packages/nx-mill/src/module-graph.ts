/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** One `JavaModule` as reported by the `moduleGraph` task in `backend/build.mill`. */
export interface MillModule {
  /** Repo-relative directory, e.g. `backend/article-api`. */
  root: string;
  moduleDeps: string[];
  compileDeps: string[];
  runDeps: string[];
  /** True for the deployable services, i.e. the ones `mill show components` lists. */
  isComponent: boolean;
  kind: "scala" | "kotlin" | "other";
}

export type MillModuleGraph = Record<string, MillModule>;

/** Mill wraps every cached task result in this envelope under `out/<task>.json`. */
interface MillCacheEnvelope {
  value?: unknown;
  millVersion?: string;
}

export const BACKEND_DIR = "backend";
const CACHE_FILE = join(BACKEND_DIR, "out", "moduleGraph.json");

const read = (path: string): string | undefined => (existsSync(path) ? readFileSync(path, "utf8") : undefined);

/**
 * The Mill version the launcher would use, so a stale cache from another version is not trusted.
 * Mirrors the launcher's own resolution order: `.mill-version` wins, and `DEFAULT_MILL_VERSION` is
 * only the fallback for a checkout that does not pin one.
 */
const expectedMillVersion = (workspaceRoot: string): string | undefined => {
  const backend = join(workspaceRoot, BACKEND_DIR);

  const pinned = read(join(backend, ".mill-version"))?.split("\n")[0]?.trim();
  if (pinned) return pinned;

  const launcher = read(join(backend, "mill"));
  return launcher === undefined ? undefined : /DEFAULT_MILL_VERSION=["']?([^\s"';]+)/.exec(launcher)?.[1];
};

const readCache = (workspaceRoot: string): MillModuleGraph | undefined => {
  const path = join(workspaceRoot, CACHE_FILE);
  if (!existsSync(path)) return undefined;

  let envelope: MillCacheEnvelope;
  try {
    envelope = JSON.parse(readFileSync(path, "utf8")) as MillCacheEnvelope;
  } catch {
    return undefined;
  }

  const expected = expectedMillVersion(workspaceRoot);
  if (expected && envelope.millVersion !== expected) return undefined;
  return isGraph(envelope.value) ? envelope.value : undefined;
};

/**
 * Spawns Mill. This is the cold path only: `createNodesV2` re-runs on essentially every file
 * change while the nx daemon is up, so the cached `out/moduleGraph.json` must carry normal use.
 */
const evaluate = (workspaceRoot: string): MillModuleGraph => {
  const stdout = execFileSync("./mill", ["-i", "show", "moduleGraph"], {
    cwd: join(workspaceRoot, BACKEND_DIR),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });

  // `show` prints the JSON value, but Mill may log ahead of it on the same stream.
  const start = stdout.indexOf("{");
  if (start === -1) throw new Error("`mill show moduleGraph` produced no JSON object");

  const parsed: unknown = JSON.parse(stdout.slice(start));
  if (!isGraph(parsed)) throw new Error("`mill show moduleGraph` returned an unexpected shape");
  return parsed;
};

const isGraph = (value: unknown): value is MillModuleGraph =>
  typeof value === "object" &&
  value !== null &&
  Object.values(value).every(
    (entry) => typeof entry === "object" && entry !== null && typeof (entry as MillModule).root === "string",
  );

/**
 * Reads the module graph, preferring Mill's own on-disk cache and falling back to evaluating the
 * task. Memoized per process so the several graph consumers in one nx invocation share a read.
 */
let memo: { root: string; graph: MillModuleGraph } | undefined;

export const readModuleGraph = (workspaceRoot: string): MillModuleGraph => {
  if (memo?.root === workspaceRoot) return memo.graph;
  const graph = readCache(workspaceRoot) ?? evaluate(workspaceRoot);
  memo = { root: workspaceRoot, graph };
  return graph;
};

/** Test submodules (`article-api.test`) share a root with their parent and are not nx projects. */
export const isProjectModule = (name: string, module: MillModule): boolean =>
  !name.includes(".") && module.kind !== "other";
