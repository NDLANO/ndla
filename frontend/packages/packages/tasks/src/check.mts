/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { backend, dispatch, frontend, javaModules, mill, nx, project, run } from "./repo.mts";

const checkBackend = (): number => {
  const java = javaModules().includes(project);
  const fmt = java
    ? mill(`${project}.spotless`, "--check")
    : mill("mill.scalalib.scalafmt/checkFormatAll", `${project}.__.sources`);
  const compile = mill(`${project}.__.compile`);
  const copyrightCheck = java ? 0 : mill(`${project}.copyrightCheck`);
  return fmt || compile || copyrightCheck;
};

const checkFrontend = (): number =>
  nx("run-many", "-t", "type-check", "lint-es", "format-check", "test", "-p", project);

const checkAll = (): number => {
  const nxAll = run(frontend, "pnpm", "run", "check-all");
  const fmt = run(backend, "./checkfmt.sh");
  const compile = mill("__.compile");
  const semanticDb = mill("_.semanticDbData");
  const dependencyGraph = mill("dependency-graph.run");
  const copyrightCheck = mill("_.copyrightCheck");
  return nxAll || fmt || compile || semanticDb || dependencyGraph || copyrightCheck;
};

export const check = (): number => {
  if (project) return dispatch("check", checkBackend, checkFrontend);
  return checkAll();
};
