/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { index, prefix, route, type RouteConfigEntry } from "@react-router/dev/routes";

/** A route in an app. `createRouteConfig` turns a tree of these into the React Router route config. */
export interface AppRoute {
  path?: string;
  index?: boolean;
  /** Route module, relative to the app directory. A route without one only prefixes its children with `path`. */
  file?: string;
  children?: AppRoute[];
}

interface RouteConfigOptions {
  /** Every route in `routes` is registered once without a locale prefix, and once below each of these. */
  locales: readonly string[];
  routes: AppRoute[];
  /** Routes registered once, outside the locale branches. */
  standaloneRoutes?: AppRoute[];
}

export const prefixPath = (lang: string, path: string | undefined): string | undefined => {
  if (!lang) return path;
  return path && path !== "/" ? `/${lang}/${path.replace(/^\//, "")}` : `/${lang}`;
};

const joinPath = (parent: string, child: string | undefined) =>
  child ? `${parent.replace(/\/$/, "")}/${child.replace(/^\//, "")}` : parent;

export const createRouteConfig = ({ locales, routes, standaloneRoutes = [] }: RouteConfigOptions) => {
  const usedIds = new Set<string>();

  /**
   * Route ids must be unique, but every locale branch registers the same files, and some files are
   * registered more than once within a branch. The full path tells those apart.
   */
  const createRouteId = (lang: string, file: string, fullPath: string) => {
    const id = `${lang ? `${lang}:` : ""}${file.replace(/\.tsx?$/, "")}`;
    const uniqueId = usedIds.has(id) ? `${id}@${fullPath}` : id;
    usedIds.add(uniqueId);
    return uniqueId;
  };

  const toRouteConfig = (appRoutes: AppRoute[], lang: string, parentPath = ""): RouteConfigEntry[] =>
    appRoutes.flatMap((appRoute) => {
      const fullPath = joinPath(parentPath, appRoute.path);
      const children = appRoute.children ? toRouteConfig(appRoute.children, lang, fullPath) : undefined;
      if (!appRoute.file) {
        return prefix(appRoute.path ?? "", children ?? []);
      }
      const id = createRouteId(lang, appRoute.file, fullPath);
      return appRoute.index ? index(appRoute.file, { id }) : route(appRoute.path, appRoute.file, { id }, children);
    });

  /** The locale prefix is matched case-sensitively, since the rest of the app only recognizes it in lowercase. */
  const localeRoutes = ["", ...locales].flatMap((lang) =>
    toRouteConfig(
      routes.map((appRoute) => ({ ...appRoute, path: prefixPath(lang, appRoute.path) })),
      lang,
    ).map((entry): RouteConfigEntry => ({ ...entry, caseSensitive: !!lang })),
  );

  return [...localeRoutes, ...toRouteConfig(standaloneRoutes, "")];
};
