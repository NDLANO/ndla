/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { join } from "node:path";
import { toolVersionChanged } from "./affected.mts";
import { env, flag, repoRoot, report, setOutput } from "./github.mts";
import { asStringArray, runJson, runLines, toLines } from "./shell.mts";

const root = repoRoot();
const frontend = join(root, "frontend");

const showProjects = (...args: string[]): string[] => {
  const argv = ["exec", "nx", "show", "projects", "--json", ...args];
  return asStringArray(runJson("pnpm", argv, { cwd: frontend }), `pnpm ${argv.join(" ")}`);
};

/** The images install node and pnpm from mise.toml, which sits outside the nx workspace and is invisible to `--affected`. */
const toolVersionsChanged = (): boolean =>
  toolVersionChanged(runLines("git", ["diff", "-U0", env("NX_BASE"), "HEAD", "--", "mise.toml"], { cwd: root }), [
    "node",
    "pnpm",
  ]);

/** Pathspecs no nx project owns, so `--affected` never selects anything for them. */
const forceAllPaths = toLines(env("FORCE_ALL_PATHS"));

const forcedPathsChanged = (): boolean =>
  forceAllPaths.length > 0 &&
  runLines("git", ["diff", "--name-only", env("NX_BASE"), "HEAD", "--", ...forceAllPaths], { cwd: root }).length > 0;

const only = env("ONLY");
const all = flag("ALL");

const resolve = (): { projects: string[]; why: string } => {
  if (only)
    return {
      projects: showProjects().filter((project) => project === only),
      why: `explicitly requested: ${only}`,
    };
  if (all)
    return {
      projects: showProjects(),
      why: "every project explicitly requested",
    };
  try {
    if (toolVersionsChanged())
      return {
        projects: showProjects(),
        why: `node/pnpm version changed in mise.toml since ${env("NX_BASE")}`,
      };
    if (forcedPathsChanged())
      return {
        projects: showProjects(),
        why: `files outside the nx workspace changed since ${env("NX_BASE")}`,
      };
    return {
      projects: showProjects("--affected"),
      why: `comparing ${env("NX_BASE")} against HEAD`,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      projects: showProjects(),
      why: `could not resolve affected projects (${reason}); assuming all`,
    };
  }
};

const { projects, why } = resolve();

/** Narrows the selection to the projects nx reports for `filters`, e.g. those carrying a tag. */
const restrictTo = (...filters: string[]): string[] => {
  const allowed = new Set(showProjects(...filters));
  return projects.filter((project) => allowed.has(project));
};

const outputs = {
  projects,
  count: projects.length,
  e2e: restrictTo("--with-target", "e2e:headless"),
  releasable: restrictTo("--projects", "tag:releasable"),
  vercel: restrictTo("--projects", "tag:vercel"),
};

const lines = [`${projects.length} project(s) selected, ${why}`];
for (const [name, value] of Object.entries(outputs)) {
  const json = JSON.stringify(value);
  lines.push(`${name}: ${json}`);
  setOutput(name, json);
}

report(lines.join("; "), lines);
