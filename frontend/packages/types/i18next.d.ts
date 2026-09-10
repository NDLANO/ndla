/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Messages } from "@ndla/locales";

// Scoped to the frontend-packages program on purpose: library code may only use shared keys.
// Apps augment CustomTypeOptions["resources"] with their own merged key space instead.
declare module "i18next" {
  interface ResourceNamespaceMap {
    translation: Messages;
  }
  interface CustomTypeOptions {
    parseInterpolation: false;
  }
}
