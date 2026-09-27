/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getErrorLog } from "./errorLog";
import { deriveLogLevel, type LogLevel } from "./logLevel";

type LogMethod = (message: unknown, ...meta: unknown[]) => void;

export interface Logger {
  log: (level: LogLevel, message: unknown, ...meta: unknown[]) => void;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

export const logError = (
  logger: Logger,
  error: unknown,
  extraContext: Record<string, unknown> = {},
  level: LogLevel = deriveLogLevel(error) ?? "error",
) => logger.log(level, getErrorLog(error, extraContext));
