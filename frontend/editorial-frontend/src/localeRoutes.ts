/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { PathLocale } from "./interfaces";

export const LocaleValues = ["nb", "nn", "en"] as const;

/** The app is registered once without a locale prefix, and once below each supported locale. */
export const localePrefixes: PathLocale[] = ["", ...LocaleValues];

export const prefixPath = (lang: PathLocale, path: string | undefined): string | undefined => {
  if (!lang) return path;
  return path && path !== "/" ? `/${lang}/${path.replace(/^\//, "")}` : `/${lang}`;
};
