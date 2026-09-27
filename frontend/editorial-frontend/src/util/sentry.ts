/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { initSentry as initSharedSentry } from "@ndla/shared/sentry";
import type { ConfigType } from "../config";

export const initSentry = (config: ConfigType) =>
  initSharedSentry({ ...config, enableSentry: import.meta.env.PROD && config.enableSentry });
