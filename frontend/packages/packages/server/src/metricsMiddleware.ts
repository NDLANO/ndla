/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Gauge, Histogram, Registry } from "@prometheus-io/client";
import type { Request, RequestHandler } from "express";
import { match } from "path-to-regexp";

export interface MetricsMiddlewareOptions {
  includeMethod?: boolean;
  includePath?: boolean;
  excludeRoutes?: (string | RegExp)[];
  normalizePath?: (req: Request) => string;
}

const UNMATCHED_ROUTE = "unmatched";
const METRICS_PATH = /^\/metrics\/?$/;
const CLIENT_CLOSED_REQUEST = 499;

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

const isExcluded = (path: string, excludeRoutes: (string | RegExp)[]): boolean =>
  excludeRoutes.some((route) => (typeof route === "string" ? route === path : route.test(path)));

export const createMetricsMiddleware = ({
  includeMethod = true,
  includePath = true,
  excludeRoutes = ["/health", /\/health\/.*/],
  normalizePath = normalizeExpressRoutePath,
}: MetricsMiddlewareOptions = {}): RequestHandler => {
  const registry = new Registry();
  const labelNames = ["status_code", ...(includeMethod ? ["method"] : []), ...(includePath ? ["path"] : [])];
  const httpDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: `duration histogram of http responses labeled with: ${labelNames.join(", ")}`,
    labelNames,
    buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
    registers: [registry],
  });
  new Gauge({ name: "up", help: "1 = up, 0 = not up", registers: [registry] }).set(1);

  return (req, res, next) => {
    const path = req.originalUrl;
    if (METRICS_PATH.test(path)) {
      registry.metrics().then((metrics) => res.type(registry.contentType).send(metrics), next);
      return;
    }
    if (isExcluded(path, excludeRoutes)) return next();

    const endTimer = httpDuration.startTimer();
    let recorded = false;
    const record = (): void => {
      if (recorded) return;
      recorded = true;
      const labels: Record<string, string | number> = {
        status_code: res.headersSent ? res.statusCode : CLIENT_CLOSED_REQUEST,
      };
      if (includeMethod) labels.method = req.method;
      if (includePath) labels.path = normalizePath(req);
      endTimer(labels);
    };
    res.on("finish", record);
    res.on("close", record);
    next();
  };
};
