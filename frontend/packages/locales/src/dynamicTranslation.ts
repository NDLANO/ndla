/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TFunction } from "i18next";

/**
 * For keys interpolated from a value that is not ours to narrow — a backend enum typed as an open
 * `string`, a URL query parameter, an aggregation bucket. Narrow at the origin whenever the value
 * comes from a prop, a local constant or a closed union in the generated API types, and reach for
 * this only when it does not. An assertion to a key type is never the answer: it silences the
 * checker without making the lookup any safer.
 *
 * `defaultValue` is what lets i18next accept an untyped key; it renders the key itself on a miss,
 * matching what a plain `t()` would have done.
 */
export const tDynamic = (t: TFunction, key: string, options?: Record<string, unknown>): string =>
  t(key, { defaultValue: key, ...options });
