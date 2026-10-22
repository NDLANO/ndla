/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRouteConfig } from "@ndla/shared/routes";
import type { RouteConfig } from "@react-router/dev/routes";
import { routes, standaloneRoutes } from "./appRoutes";
import { LocaleValues } from "./constants";

export default createRouteConfig({ locales: LocaleValues, routes, standaloneRoutes }) satisfies RouteConfig;
