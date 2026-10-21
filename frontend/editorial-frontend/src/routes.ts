/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { index, prefix, route, type RouteConfig, type RouteConfigEntry } from "@react-router/dev/routes";
import { type AppRoute, routes as appRoutes } from "./appRoutes";
import { localePrefixes, prefixPath } from "./localeRoutes";

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

const joinPath = (parent: string, child: string | undefined) =>
  child ? `${parent.replace(/\/$/, "")}/${child.replace(/^\//, "")}` : parent;

const toRouteConfig = (routes: AppRoute[], lang: string, parentPath = ""): RouteConfigEntry[] =>
  routes.flatMap((appRoute) => {
    const fullPath = joinPath(parentPath, appRoute.path);
    const children = appRoute.children ? toRouteConfig(appRoute.children, lang, fullPath) : undefined;
    if (!appRoute.file) {
      return prefix(appRoute.path ?? "", children ?? []);
    }
    const id = createRouteId(lang, appRoute.file, fullPath);
    return appRoute.index ? index(appRoute.file, { id }) : route(appRoute.path, appRoute.file, { id }, children);
  });

export default localePrefixes.flatMap((lang) =>
  toRouteConfig(
    appRoutes.map((appRoute) => ({ ...appRoute, path: prefixPath(lang, appRoute.path) })),
    lang,
  ),
) satisfies RouteConfig;
