/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TFunction } from "i18next";

/**
 * Escape hatch for keys that genuinely cannot be known at compile time, e.g. derived from backend
 * data. Prefer narrowing the interpolated type at its origin; every call site should say why it
 * cannot. Falls back to rendering the key, matching i18next's default for a missing key.
 */
export const tDynamic = (t: TFunction, key: string, options?: Record<string, unknown>): string =>
  t(key, { defaultValue: key, ...options });
