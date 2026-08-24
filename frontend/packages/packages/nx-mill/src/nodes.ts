/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ProjectConfiguration, TargetConfiguration } from "nx/src/config/workspace-json-project-json";
import { createNodesFromFiles, type CreateNodesV2 } from "nx/src/project-graph/plugins";
import { BACKEND_DIR, isProjectModule, readModuleGraph, type MillModule } from "./module-graph.ts";

/** Every `package.mill` directly under `backend/` defines one module. */
export const MILL_MODULE_PATTERN = `${BACKEND_DIR}/*/package.mill`;

/**
 * Build inputs Mill's own change detection sees but nx's file-to-project-root mapping cannot,
 * because no project is rooted at `backend/` itself. Declaring them as `{workspaceRoot}` inputs
 * makes nx treat them as implicit dependencies of every Mill project, so `nx affected` reacts to
 * them. Mirrors `UNTRACKED_BY_MILL` in `@ndla/ci`'s `backend-affected.mts`.
 */
const SHARED_BUILD_INPUTS = [
  "{workspaceRoot}/mise.toml",
  "{workspaceRoot}/backend/build.mill",
  "{workspaceRoot}/backend/mill",
  "{workspaceRoot}/backend/.mill-version",
  "{workspaceRoot}/backend/Dockerfile",
  "{workspaceRoot}/backend/jvm-runtime-options",
  "{workspaceRoot}/backend/build.properties",
  "{workspaceRoot}/backend/build.sh",
  "{workspaceRoot}/backend/modules/**/*",
  "{workspaceRoot}/backend/.scalafmt.conf",
];

/**
 * Mill keeps its own incremental state and serializes concurrent invocations on a workspace lock,
 * so nx neither caches these nor runs two at once — it orchestrates and selects, Mill executes.
 *
 * `cache` and `parallelism` are also pinned by the `nx:run-commands` entry in nx.json's
 * targetDefaults, which is what actually decides them: nx applies target defaults on top of
 * targets contributed by non-core plugins. They are repeated here so reading this file alone
 * still tells you how these targets are meant to run.
 */
const millTarget = (command: string, extra: Partial<TargetConfiguration> = {}): TargetConfiguration => ({
  command,
  options: { cwd: BACKEND_DIR },
  cache: false,
  parallelism: false,
  inputs: ["default", "^default", ...SHARED_BUILD_INPUTS],
  ...extra,
});

const targetsFor = (name: string, module: MillModule): Record<string, TargetConfiguration> => {
  const targets: Record<string, TargetConfiguration> = {
    // Named to match the frontend's vocabulary: `compile` is the JVM's `tsc --noEmit`.
    "type-check": millTarget(`./mill ${name}.compile`),
    test: millTarget(`./mill ${name}.test`),
    format: millTarget(`./mill ${name}.fmt`),
    "format-check": millTarget(`./mill ${name}.checkFmt`),
  };

  // CopyrightHeaderPlugin is mixed into BaseModule only, so Kotlin modules have no such task.
  if (module.kind === "scala") {
    targets["copyright-check"] = millTarget(`./mill ${name}.copyrightCheck`);
  }

  if (module.isComponent) {
    // dev.sh, not `mill -w <c>.run`: `run` never returns, so Mill's watch loop never gets
    // control and nothing is rebuilt. The script uses runBackground and stops it on exit.
    targets.dev = millTarget(`./dev.sh ${name}`, { continuous: true });
    targets.build = millTarget(`./mill ${name}.assembly`);
    targets["generate-types"] = millTarget(`./mill ${name}.generateTypescript`, {
      // Reads the package's generator; writes back into it. createDependencies models the
      // resulting edge (types-backend depends on the component that generates its sources).
      inputs: [
        "default",
        "^default",
        ...SHARED_BUILD_INPUTS,
        "{workspaceRoot}/frontend/packages/packages/types-backend/scripts/**/*",
      ],
      outputs: [
        `{workspaceRoot}/frontend/packages/packages/types-backend/openapi/${name}.json`,
        `{workspaceRoot}/frontend/packages/packages/types-backend/src/${name}.ts`,
      ],
    });
    targets.docker = millTarget(`./build.sh ${name}`);
  }

  return targets;
};

const projectFor = (name: string, module: MillModule): ProjectConfiguration => ({
  // Required: nx only derives a name from the directory when a real project.json exists on disk.
  name,
  root: module.root,
  projectType: module.isComponent ? "application" : "library",
  tags: ["backend", `lang:${module.kind}`, ...(module.isComponent ? ["component"] : [])],
  targets: targetsFor(name, module),
});

export const createNodesV2: CreateNodesV2 = [
  MILL_MODULE_PATTERN,
  (configFiles, options, context) =>
    createNodesFromFiles(
      (configFile) => {
        const graph = readModuleGraph(context.workspaceRoot);
        // `backend/<dir>/package.mill` -> `<dir>`; the Mill module name matches its directory.
        const name = configFile.split("/").at(-2) ?? "";
        const module = graph[name];
        if (!module || !isProjectModule(name, module)) return {};
        return { projects: { [module.root]: projectFor(name, module) } };
      },
      configFiles,
      options,
      context,
    ),
];
