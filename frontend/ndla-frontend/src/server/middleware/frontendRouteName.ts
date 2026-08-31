/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Request } from "express";
import { matchPath } from "react-router";
import { getLocaleInfoFromPath } from "../../i18n";
import { flattenedRoutes } from "../../routes";

export const getFrontendRouteName = (req: Request): string | undefined => {
  const { basepath } = getLocaleInfoFromPath(req.path);
  return flattenedRoutes.find((route) => matchPath(route, basepath));
};
