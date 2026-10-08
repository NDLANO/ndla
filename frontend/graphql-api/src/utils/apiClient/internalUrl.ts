/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { environmentApiHost } from "../../config";
import { apiResourceUrl } from "../apiHelpers";

/** Replaces ndla api urls with internal api-gateway if applicable */
export function toInternalUrl(request: Request): Request {
  const url = new URL(request.url);
  const withoutHost = url.toString().replace(url.origin, "");
  if (url.hostname === environmentApiHost) {
    const newUrl = apiResourceUrl(withoutHost);
    return new Request(newUrl, request);
  }
  return request;
}
