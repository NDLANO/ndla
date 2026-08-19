/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSpanNamingMiddleware } from "@ndla/server";
import { getFrontendRouteName } from "./frontendRouteName";

export const spanNamingMiddleware = createSpanNamingMiddleware(getFrontendRouteName);
