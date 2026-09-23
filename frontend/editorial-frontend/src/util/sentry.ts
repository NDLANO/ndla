/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isApiError } from "@ndla/api-client";
import { createBeforeSend, initSentry as initSharedSentry } from "@ndla/shared";
import type { ConfigType } from "../config";

const INFORMATIONAL_STATUS_CODES = [401, 403, 404, 410];

export const beforeSend = createBeforeSend(
  (exception) => isApiError(exception) && INFORMATIONAL_STATUS_CODES.includes(exception.status),
);

export const initSentry = (config: ConfigType) => initSharedSentry(config, beforeSend);
