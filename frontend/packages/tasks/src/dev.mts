/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { dispatch, mill, nx, project } from "./repo.mts";

export const dev = (args: string[]): number =>
  dispatch(
    "dev",
    () => mill(`${project}.run`, ...args),
    () => nx("dev", project, ...args),
  );
