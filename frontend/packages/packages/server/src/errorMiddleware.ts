/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { STATUS_CODES } from "node:http";
import { logError, type Logger } from "@ndla/shared";
import type { ErrorRequestHandler } from "express";

export const getErrorStatusCode = (error: unknown): number => {
  if (typeof error === "object" && error !== null && "status" in error && typeof error.status === "number") {
    if (error.status >= 400 && error.status < 600) return error.status;
  }
  return 500;
};

const getErrorHeaders = (error: unknown): Record<string, unknown> => {
  if (typeof error === "object" && error !== null && "headers" in error && typeof error.headers === "object") {
    return { ...error.headers };
  }
  return {};
};

export const createErrorMiddleware =
  (logger: Logger): ErrorRequestHandler =>
  (err, _req, res, next) => {
    const statusCode = getErrorStatusCode(err);
    logError(logger, err, { statusCode });
    if (res.headersSent) {
      next(err);
      return;
    }
    res.set(getErrorHeaders(err)).status(statusCode).send(STATUS_CODES[statusCode]);
  };
