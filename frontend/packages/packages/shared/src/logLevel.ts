/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NDLAError } from "./errors";

export type LogLevel = "error" | "warn" | "info";

export const getLogLevelFromStatusCode = (statusCode: number): LogLevel => {
  if ([401, 403, 404, 410].includes(statusCode)) return "info";
  if (statusCode < 500) return "warn";
  return "error";
};

export const mergeLogLevels = (levels: LogLevel[]): LogLevel | undefined => {
  if (levels.length === 0) return undefined;
  if (levels.includes("error")) return "error";
  if (levels.includes("warn")) return "warn";
  return "info";
};

const getStatus = (error: unknown): number | undefined => {
  if (typeof error === "object" && error !== null && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
};

export const deriveLogLevel = (error: unknown): LogLevel | undefined => {
  if (error instanceof NDLAError) return error.logLevel;
  const status = getStatus(error);
  return status ? getLogLevelFromStatusCode(status) : undefined;
};
