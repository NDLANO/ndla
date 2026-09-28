/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { matchRoutes, type RouteObject } from "react-router";

interface RouteEntry {
  path?: string;
  index?: boolean;
  file?: string;
  children?: RouteEntry[];
}

/** Turns the app route tree, or the React Router route config, into routes `matchRoutes` accepts. */
export const toRouteObjects = (routes: RouteEntry[]): RouteObject[] =>
  routes.map(({ path, index, file, children }) =>
    index
      ? { index: true, path, handle: file }
      : { path, handle: file, children: children && toRouteObjects(children) },
  );

export const matchLeaf = (routes: RouteObject[], path: string): RouteObject | undefined =>
  matchRoutes(routes, path)?.at(-1)?.route;

/** Identifies the page a path lands on: its route module, or the path pattern of a leaf without one. */
export const leafOf = (routes: RouteObject[], path: string): string | undefined => {
  const leaf = matchLeaf(routes, path);
  return leaf?.handle ?? leaf?.path;
};
