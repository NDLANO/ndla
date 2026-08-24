/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DependencyType } from "nx/src/config/project-graph";
import type { CreateDependencies } from "nx/src/project-graph/plugins";
import { validateDependency, type RawProjectGraphDependency } from "nx/src/project-graph/project-graph-builder";
import { BACKEND_DIR, isProjectModule, readModuleGraph } from "./module-graph.ts";

/** The package whose sources the components' `generateTypescript` writes. */
const TYPES_BACKEND = "@ndla/types-backend";

/**
 * Projects the Mill module graph onto nx's, plus the cross-stack edge the two build systems share.
 *
 * That edge points from `@ndla/types-backend` to each component, not the other way round: the
 * package's `openapi/<c>.json` and `src/<c>.ts` are *generated from* the component's Tapir
 * endpoints, so the package is the dependent. nx marks a touched project's dependents as
 * affected, so this is what makes a changed endpoint reach the TypeScript types — and through
 * them the frontend apps that import them.
 *
 * `include`/`exclude` in nx.json only filter createNodes, so this filters for itself.
 */
export const createDependencies: CreateDependencies = (_options, context) => {
  const byName = new Set(
    Object.entries(context.projects)
      .filter(([, project]) => project.root.startsWith(`${BACKEND_DIR}/`))
      .map(([name]) => name),
  );

  // No Mill projects means no backend in this checkout — the frontend Docker images build
  // from a context that excludes it. Return before touching the module graph, or we would
  // try to run a `./mill` that is not there and take the whole project graph down with us.
  if (byName.size === 0) return [];

  const graph = readModuleGraph(context.workspaceRoot);

  const dependencies: RawProjectGraphDependency[] = [];

  /** nx requires a static dependency's `sourceFile` to belong to the *source* project. */
  const filesOf = (project: string): ReadonlySet<string> =>
    new Set((context.fileMap.projectFileMap[project] ?? []).map((file) => file.file));

  const add = (dependency: RawProjectGraphDependency) => {
    validateDependency(dependency, context);
    dependencies.push(dependency);
  };

  const addStatic = (source: string, target: string, sourceFile: string) =>
    add({ source, target, type: DependencyType.static, sourceFile });

  const typesBackendFiles = filesOf(TYPES_BACKEND);

  for (const [name, module] of Object.entries(graph)) {
    if (!isProjectModule(name, module) || !byName.has(name)) continue;
    const sourceFile = `${module.root}/package.mill`;

    const deps = [...module.moduleDeps, ...module.compileDeps, ...module.runDeps];
    for (const dep of new Set(deps)) {
      if (byName.has(dep)) addStatic(name, dep, sourceFile);
    }

    if (module.isComponent && context.projects[TYPES_BACKEND]) {
      // Anchor the edge on the generated file when it is already checked in; a component whose
      // types have never been generated has no such file, so fall back to an implicit edge.
      const generated = `${context.projects[TYPES_BACKEND].root}/src/${name}.ts`;
      if (typesBackendFiles.has(generated)) {
        addStatic(TYPES_BACKEND, name, generated);
      } else {
        add({ source: TYPES_BACKEND, target: name, type: DependencyType.implicit });
      }
    }
  }

  return dependencies;
};
