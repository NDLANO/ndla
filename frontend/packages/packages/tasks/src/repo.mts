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
export const frontend = join(root, "frontend");
export const backend = join(root, "backend");
export const project = process.env["usage_project"] ?? "";

/** runs with mise to make sure we pick up nested `.mise.toml` */
export const run = (dir: string, ...command: string[]): number =>
  spawnSync("mise", ["exec", "--", ...command], { cwd: dir, stdio: "inherit" }).status ?? 1;

export const mill = (...command: string[]): number => run(backend, "./mill", ...command);
export const nx = (...command: string[]): number => run(frontend, "pnpm", "exec", "nx", ...command);

const find = (dir: string, file: string, needle: string): string[] =>
  readdirSync(dir)
    .filter((name) => {
      const path = join(dir, name, file);
      return existsSync(path) && readFileSync(path, "utf8").includes(needle);
    })
    .sort();

const services = (): string[] => find(backend, "package.mill", "DockerComponent");
const testable = (): string[] => find(backend, "package.mill", "object test");
/** java modules format with spotless instead of scalafmt, and have no copyright check */
export const javaModules = (): string[] => find(backend, "package.mill", "JavaBaseModule");

const nxProjects = (script: string): string[] =>
  readdirSync(frontend)
    .map((entry) => join(frontend, entry, "package.json"))
    .filter((path) => existsSync(path))
    .map((path) => JSON.parse(readFileSync(path, "utf8")) as { name?: string; scripts?: Record<string, string> })
    .flatMap((pkg) => (pkg.name !== undefined && pkg.scripts?.[script] !== undefined ? [pkg.name] : []))
    .sort();

/** `dev` only runs apps and services, the other tasks handle libraries too */
export const frontendProjects = (scope: string): string[] => nxProjects(scope === "dev" ? "dev" : "test");
export const backendProjects = (scope: string): string[] => (scope === "dev" ? services() : testable());

/** Sends `project` to mill or to nx, whichever half of the repo it lives in. */
export const dispatch = (scope: string, onBackend: () => number, onFrontend: () => number): number => {
  if (backendProjects(scope).includes(project)) return onBackend();
  if (frontendProjects(scope).includes(project)) return onFrontend();
  process.stderr.write(
    [
      `Unknown ${scope} project: ${project || "(none given)"}`,
      `Frontend:  ${frontendProjects(scope).join(" ")}`,
      `Backend:   ${backendProjects(scope).join(" ")}`,
      "",
    ].join("\n"),
  );
  return 1;
};
