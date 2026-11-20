/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Middleware } from "openapi-fetch";
import { toInternalApiUrl } from "../apiHelpers";

/** This middleware replaces ndla api urls with internal api-gateway if applicable */
export const OATSInternalUrlMiddleware: Middleware = {
  async onRequest({ request }) {
    const newUrl = toInternalApiUrl(request.url);
    return newUrl === request.url ? request : new Request(newUrl, request);
  },
};
