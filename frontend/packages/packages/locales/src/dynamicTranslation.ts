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
 * cannot. `defaultValue` is what lets i18next accept an untyped key; it renders the key on a miss.
 */
export const tDynamic = (t: TFunction, key: string, options?: Record<string, unknown>): string =>
  t(key, { defaultValue: key, ...options });
