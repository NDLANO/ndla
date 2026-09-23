/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createBeforeSend, initSentry as initSharedSentry } from "@ndla/shared";
import type { ConfigType } from "../config";
import { deriveLogLevel } from "./handleError";

export const beforeSend = createBeforeSend((exception) => deriveLogLevel(exception) === "info");

export const initSentry = (config: ConfigType) => initSharedSentry(config, beforeSend);
