/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { backendProjects, frontendProjects } from "./repo.mts";

export const projects = (args: string[]): number => {
  const scope = args[0] ?? "";
  process.stdout.write(`${[...frontendProjects(scope), ...backendProjects(scope)].join("\n")}\n`);
  return 0;
};
