/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { backend, dispatch, frontend, javaModules, mill, project, run } from "./repo.mts";

const formatBackend = (): number =>
  javaModules().includes(project)
    ? mill(`${project}.spotless`)
    : mill("mill.scalalib.scalafmt/reformatAll", `${project}.__.sources`);

const formatFrontend = (): number => run(frontend, "pnpm", "run", "format");

const formatAll = (): number => {
  const nxAll = formatFrontend();
  const millAll = run(backend, "./fmt.sh");
  return nxAll || millAll;
};

export const format = (): number => {
  if (project) return dispatch("format", formatBackend, formatFrontend);
  return formatAll();
};
