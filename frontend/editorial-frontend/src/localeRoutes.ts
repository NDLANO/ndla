/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { RouteObject } from "react-router";
import type { PathLocale } from "./interfaces";

export const LocaleValues = ["nb", "nn", "en"] as const;

export const localePrefixes: PathLocale[] = ["", ...LocaleValues];

export const prefixPath = (lang: PathLocale, path: string | undefined): string | undefined => {
  if (!lang) return path;
  return path && path !== "/" ? `/${lang}/${path.replace(/^\//, "")}` : `/${lang}`;
};

/** Creates a route object array with the given routes, once for each of the locale prefixes */
export const withLocalePrefixes = (routes: RouteObject[]): RouteObject[] =>
  localePrefixes.flatMap((lang) => routes.map((route) => ({ ...route, path: prefixPath(lang, route.path) })));
