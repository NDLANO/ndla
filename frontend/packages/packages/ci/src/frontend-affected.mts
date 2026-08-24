/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { env, flag, repoRoot, report, setOutput } from "./github.mts";
import { asStringArray, runJson } from "./shell.mts";

const root = repoRoot();

const showProjects = (...args: string[]): string[] => {
  const argv = ["exec", "nx", "show", "projects", "--json", ...args];
  return asStringArray(runJson("pnpm", argv, { cwd: root }), `pnpm ${argv.join(" ")}`);
};

const only = env("ONLY");
const all = flag("ALL");

const resolve = (): { projects: string[]; why: string } => {
  if (only) return { projects: [only], why: `explicitly requested: ${only}` };
  if (all) return { projects: showProjects(), why: "every project explicitly requested" };
  try {
    return { projects: showProjects("--affected"), why: `comparing ${env("NX_BASE")} against HEAD` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { projects: showProjects(), why: `could not resolve affected projects (${reason}); assuming all` };
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
};

const lines = [`${projects.length} project(s) selected, ${why}`];
for (const [name, value] of Object.entries(outputs)) {
  const json = JSON.stringify(value);
  lines.push(`${name}: ${json}`);
  setOutput(name, json);
}

report(lines.join("; "), lines);
