/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.env["MISE_PROJECT_ROOT"] ?? process.cwd();
const frontend = join(root, "frontend");
const backend = join(root, "backend");
const project = process.env["usage_project"] ?? "";

/** runs with mise to make sure we pick up nested `.mise.toml` */
const run = (dir: string, ...command: string[]): number =>
  spawnSync("mise", ["exec", "--", ...command], { cwd: dir, stdio: "inherit" }).status ?? 1;

const find = (dir: string, file: string, needle: string): string[] =>
  readdirSync(dir)
    .filter((name) => {
      const path = join(dir, name, file);
      return existsSync(path) && readFileSync(path, "utf8").includes(needle);
    })
    .sort();

const services = (): string[] => find(backend, "package.mill", "DockerComponent");
const testable = (): string[] => find(backend, "package.mill", "object test");

const nxProjects = (script: string): string[] =>
  readdirSync(frontend)
    .map((entry) => join(frontend, entry, "package.json"))
    .filter((path) => existsSync(path))
    .map((path) => JSON.parse(readFileSync(path, "utf8")) as { name?: string; scripts?: Record<string, string> })
    .flatMap((pkg) => (pkg.name !== undefined && pkg.scripts?.[script] !== undefined ? [pkg.name] : []))
    .sort();

const task = process.argv[2] ?? "";
const scope = task === "projects" ? (process.argv[3] ?? "") : task;
const forDev = scope === "dev";
const frontendProjects = (): string[] => nxProjects(forDev ? "dev" : "test");
const backendProjects = forDev ? services : testable;

/** Sends `project` to mill or to nx, whichever half of the repo it lives in. */
const dispatch = (mill: string[], nx: string[]): number => {
  if (existsSync(join(backend, project, "package.mill"))) return run(backend, "./mill", ...mill);
  if (frontendProjects().includes(project)) return run(frontend, "pnpm", "exec", "nx", ...nx);
  process.stderr.write(
    [
      `Unknown project: ${project || "(none given)"}`,
      `Frontend:  ${frontendProjects().join(" ")}`,
      `Backend:   ${backendProjects().join(" ")}`,
      "",
    ].join("\n"),
  );
  return 1;
};

const tasks: Record<string, () => number> = {
  dev: () => dispatch([`${project}.run`], ["dev", project]),
  test: () => dispatch([`${project}.test`], ["test", project]),
  format: () => run(frontend, "pnpm", "run", "format") || run(backend, "./fmt.sh"),
  check: () => run(frontend, "pnpm", "run", "check-all") || run(backend, "./checkfmt.sh"),
  projects: () => {
    process.stdout.write(`${[...frontendProjects(), ...backendProjects()].join("\n")}\n`);
    return 0;
  },
};

process.exit(tasks[task]?.() ?? 1);
