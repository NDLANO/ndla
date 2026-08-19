/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createMetricsMiddleware, getExpressRoutePaths, normalizeExpressRoutePath } from "@ndla/server";
import { getFrontendRouteName } from "./frontendRouteName";

export const metricsMiddleware = createMetricsMiddleware({
  normalizePath: (req) => {
    // The splat route renders the react app, so we label it with the
    // matching react-router route instead.
    if (!req.baseUrl && getExpressRoutePaths(req).includes("/*splat")) {
      const matched = getFrontendRouteName(req);
      if (!matched) return "unmatched";
      return matched.startsWith("/") ? matched : `/${matched}`;
    }

    return normalizeExpressRoutePath(req);
  },
});
