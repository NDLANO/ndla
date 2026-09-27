/**
 * Copyright (c) 2018-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Logger, LogLevel } from "@ndla/shared";

// NOTE: The winston setup does not run in a browser, so lets not import it there.
const serverLogger: Logger | undefined = import.meta.env.SSR
  ? (await import("@ndla/server")).createLogger({ service: "ndla-frontend" })
  : undefined;

const write = (level: LogLevel, message: unknown, ...meta: unknown[]) => {
  if (serverLogger) {
    serverLogger.log(level, message, ...meta);
  } else {
    console[level](message, ...meta);
  }
};

export const log: Logger = {
  log: write,
  info: (message, ...meta) => write("info", message, ...meta),
  warn: (message, ...meta) => write("warn", message, ...meta),
  error: (message, ...meta) => write("error", message, ...meta),
};
