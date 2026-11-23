/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { rmSync } from "node:fs";
import { join } from "node:path";
import { splitTasks, toolVersionChanged, typesTasks } from "./affected.mts";
import { env, flag, repoRoot, report, setOutput, warning } from "./github.mts";
import { asStringArray, run, runJson, runLines, toLines, tryRun } from "./shell.mts";

const root = repoRoot();
const backend = join(root, "backend");
const millBin = join(backend, "mill");

/** Pathspecs Mill's selective execution cannot see, so a change to any of them forces a full run. */
const forceAllPaths = toLines(env("FORCE_ALL_PATHS"));

type Mode = "only" | "all" | "selective";

const selector = env("SELECTOR");
const restrictTo = env("RESTRICT_TO");
const only = env("ONLY");
const all = flag("ALL");

const git = (args: readonly string[], stderr: "inherit" | "ignore" = "inherit"): string =>
  run("git", args, { cwd: root, stderr });
const tryGit = (args: readonly string[], stderr: "inherit" | "ignore" = "inherit"): string | undefined =>
  tryRun("git", args, { cwd: root, stderr });

const mill = (...args: string[]): string[] => runLines(millBin, ["-i", ...args], { cwd: backend });

const fetchCommit = (sha: string): string => {
  if (sha && tryGit(["cat-file", "-e", `${sha}^{commit}`], "ignore") === undefined) {
    tryGit(["fetch", "--no-tags", "--depth=1", "origin", sha]);
  }
  return sha;
};

const baseCandidate = (): string => {
  const explicit = env("BASE");
  if (explicit) return fetchCommit(explicit);
  const event = env("GITHUB_EVENT_NAME");
  if (event === "pull_request") return tryGit(["rev-parse", "HEAD^1"], "ignore")?.trim() ?? "";
  if (event === "merge_group") return fetchCommit(env("MERGE_GROUP_BASE"));
  return "";
};

const findBase = (): string => {
  const candidate = baseCandidate();
  if (!candidate) return "";
  return tryGit(["cat-file", "-e", `${candidate}^{commit}`], "ignore") === undefined ? "" : candidate;
};

const forcedPathsChanged = (base: string): boolean =>
  forceAllPaths.length > 0 && tryGit(["diff", "--quiet", base, "HEAD", "--", ...forceAllPaths]) === undefined;

const jdkChanged = (base: string): boolean =>
  toolVersionChanged(toLines(tryGit(["diff", "-U0", base, "HEAD", "--", "mise.toml"]) ?? "+java ="), ["java"]);

const decide = (base: string): { mode: Mode; why: string } => {
  if (only) return { mode: "only", why: `explicitly requested: ${only}` };
  if (all) return { mode: "all", why: "explicitly requested" };
  if (!base) return { mode: "all", why: "no base commit to compare against" };
  if (jdkChanged(base)) return { mode: "all", why: "the JDK version in mise.toml changed" };
  if (forcedPathsChanged(base)) return { mode: "all", why: "a file Mill does not track changed" };
  return { mode: "selective", why: `comparing against ${base}` };
};

const head = (): string => env("GITHUB_SHA") || git(["rev-parse", "HEAD"]).trim();

/** Snapshots the task inputs as they look at `base`, then puts the workspace back where it was. */
const prepareAtBase = (base: string): void => {
  const dirty = git(["status", "--porcelain", "--untracked-files=no"]).trim();
  if (dirty) throw new Error(`Refusing to check out ${base}: the worktree has uncommitted changes:\n${dirty}`);

  const branch = tryGit(["symbolic-ref", "--quiet", "--short", "HEAD"], "ignore")?.trim();
  const restore = branch ? ["checkout", "--quiet", branch] : ["checkout", "--quiet", "--detach", head()];

  git(["checkout", "--quiet", "--detach", base]);
  try {
    run(millBin, ["-i", "selective.prepare", selector], { cwd: backend });
  } finally {
    git(restore);
  }
};

const resolveAll = (): string[] => mill("resolve", selector);

const resolveSelectively = (): string[] => {
  const attempt = (): string[] | undefined => {
    const stdout = tryRun(millBin, ["-i", "selective.resolve", selector], {
      cwd: backend,
    });
    return stdout === undefined ? undefined : toLines(stdout);
  };

  const first = attempt();
  if (first !== undefined) return first;

  warning("selective.resolve failed; retrying with a fresh build compile");
  rmSync(join(backend, "out", "mill-build"), { recursive: true, force: true });
  const second = attempt();
  if (second !== undefined) return second;

  warning("selective.resolve failed again; falling back to every module");
  return resolveAll();
};

/** Intersects with the module names a Mill task lists, e.g. `components` for deployable services. */
const restrict = (modules: string[], task: string): string[] => {
  if (!task) return modules;
  const label = `mill show ${task}`;
  const allowed = new Set(asStringArray(runJson(millBin, ["-i", "show", task], { cwd: backend }), label));
  return modules.filter((module) => allowed.has(module));
};

export const unreachable = (parameter: never): never => {
  throw new Error(`This code should be unreachable but is not, because '${parameter}' is not of 'never' type.`);
};

const select = (mode: Mode, base: string): { selected: string[]; changed: string[] } => {
  switch (mode) {
    case "only":
      return { selected: [only], changed: [] };
    case "all":
      return { selected: resolveAll(), changed: [] };
    case "selective": {
      prepareAtBase(base);
      const selected = resolveSelectively();
      const changed = toLines(
        tryRun(millBin, ["-i", "selective.resolveChanged", selector], {
          cwd: backend,
        }) ?? "",
      );
      return { selected, changed };
    }
    default:
      return unreachable(mode);
  }
};

const base = only || all ? "" : findBase();
const { mode, why } = decide(base);
const { selected, changed } = select(mode, base);
const split = splitTasks(selected);
const modules = restrict(split.modules, restrictTo);
const types = typesTasks(split.typesModules);

const json = JSON.stringify(modules);
setOutput("modules", json);
setOutput("types-tasks", types);

const lines = [`selector: ${selector}`, `mode:     ${mode} (${why})`, `selected: ${json}`];
if (types) lines.push(`types:    ${types}`);
if (changed.length > 0) lines.push(`changed:  ${changed.join(" ")}`);
report(`Selected ${mode} (${why}): ${json}`, lines);
