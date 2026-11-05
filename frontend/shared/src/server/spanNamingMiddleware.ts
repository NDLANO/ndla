/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { trace } from "@opentelemetry/api";
import type { Request, RequestHandler } from "express";

export type RouteNameResolver = (req: Request) => string | undefined;

export const createSpanNamingMiddleware = (resolveRouteName: RouteNameResolver): RequestHandler => {
  return (req, _res, next): void => {
    const routeName = resolveRouteName(req);
    if (routeName) {
      const span = trace.getActiveSpan();
      if (span) {
        span.updateName(`${req.method} ${routeName}`);
        span.setAttribute("http.route", routeName);
      }
    }
    next();
  };
};

export const createFixedSpanNamingMiddleware = (routeName: string): RequestHandler => {
  return createSpanNamingMiddleware(() => routeName);
};

export const getFirstPathSegmentRouteName = (path: string): string => {
  const firstSegment = path.split("/").filter(Boolean)[0];
  return firstSegment ? `/${firstSegment}` : "/";
};
