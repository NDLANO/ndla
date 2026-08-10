/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Server } from "node:http";
import { getIsShuttingDown, setIsShuttingDown, waitForActiveRequests } from "@ndla/server";
import config from "../config";
import { sdk } from "../instrumentation";
import log from "./logger";

export const gracefulShutdown = (server: Server): void => {
  if (getIsShuttingDown()) return;
  setIsShuttingDown();
  const gracePeriod = config.gracePeriodSeconds;
  log.info(`Recieved shutdown signal, waiting ${gracePeriod} seconds for shutdown to be detected before stopping...`);
  setTimeout(async () => {
    log.info("Shutting down gracefully...");
    server.close();
    await waitForActiveRequests({ info: log.info.bind(log), warn: log.warn.bind(log) });
    await sdk?.shutdown().catch(() => {});
    process.exit(0);
  }, gracePeriod * 1000);
};
