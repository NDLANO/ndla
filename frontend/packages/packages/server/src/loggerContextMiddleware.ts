/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { Request, RequestHandler } from "express";

export interface LoggerContext {
  correlationID: string | undefined;
  requestPath: string;
}

export interface LoggerContextMiddlewareOptions {
  setCorrelationIdLocal?: boolean;
}

const asyncLocalStorage = new AsyncLocalStorage<LoggerContext>();

const getAsString = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

const createContext = (req: Request): LoggerContext => {
  const fromReq = getAsString(req.headers["x-correlation-id"]);
  const correlationID = fromReq ? fromReq : crypto.randomUUID();

  return {
    correlationID,
    requestPath: req.url,
  };
};

export const withLoggerContext = <T>(ctx: LoggerContext, f: () => T): T => {
  return asyncLocalStorage.run(ctx, f);
};

/** Read an incoming `x-correlation-id` (or generate one) and stash it, along with the request path, for the
 * duration of the request, so logs and outgoing server-side calls can carry it. */
export const createLoggerContextMiddleware = ({
  setCorrelationIdLocal = false,
}: LoggerContextMiddlewareOptions = {}): RequestHandler => {
  return (req, res, next): void => {
    const ctx = createContext(req);

    asyncLocalStorage.run(ctx, () => {
      if (setCorrelationIdLocal) {
        res.locals.correlationId = ctx.correlationID;
      }
      next();
    });
  };
};

export function getLoggerContextStore(): LoggerContext | undefined {
  return asyncLocalStorage.getStore();
}

export function getCorrelationId(): string | undefined {
  return getLoggerContextStore()?.correlationID;
}
