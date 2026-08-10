/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Request } from "express";
import promBundle from "express-prom-bundle";
import { match } from "path-to-regexp";

type PromBundleOptions = NonNullable<Parameters<typeof promBundle>[0]>;

export type MetricsMiddlewareOptions = PromBundleOptions;

const UNMATCHED_ROUTE = "unmatched";

const matchers = new Map<string, (path: string) => boolean>();

const matchesRoutePath = (routePath: string, requestPath: string): boolean => {
  let matcher = matchers.get(routePath);
  if (!matcher) {
    try {
      const matchRoutePath = match(routePath, { decode: false });
      matcher = (path: string): boolean => matchRoutePath(path) !== false;
    } catch {
      matcher = (path: string): boolean => path === routePath;
    }
    matchers.set(routePath, matcher);
  }
  return matcher(requestPath);
};

export const getExpressRoutePaths = (req: Request): string[] => {
  const route = req.route;
  if (!route) return [];
  return Array.isArray(route.path) ? route.path : [route.path];
};

export const normalizeExpressRoutePath = (req: Request): string => {
  const routePaths = getExpressRoutePaths(req);
  if (!routePaths.length) return UNMATCHED_ROUTE;

  if (routePaths.length > 1) {
    const matched = routePaths.find((routePath) => matchesRoutePath(routePath, req.path));
    if (matched) return `${req.baseUrl}${matched}`;
  }

  return `${req.baseUrl}${routePaths.join(",")}`;
};

export const createMetricsMiddleware = (options: MetricsMiddlewareOptions = {}) => {
  return promBundle({
    includeMethod: true,
    includePath: true,
    excludeRoutes: ["/health"],
    normalizePath: normalizeExpressRoutePath,
    ...options,
  });
};
