/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { supportedLanguages } from "./i18n";
import type { LocaleType, NdlaRouteObject } from "./interfaces";

const prefixPath = (lang: LocaleType, path: string | undefined): string =>
  path && path !== "/" ? `/${lang}/${path.replace(/^\//, "")}` : `/${lang}`;

/**
 * Creates a route object array with the given routes, plus each route prefixed with each of the supported languages
 */
export const withLocalePrefixes = (routes: NdlaRouteObject[]): NdlaRouteObject[] => [
  ...routes,
  ...supportedLanguages.flatMap((lang) => routes.map((route) => ({ ...route, path: prefixPath(lang, route.path) }))),
];
