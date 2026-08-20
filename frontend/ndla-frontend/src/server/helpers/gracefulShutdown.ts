/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Server } from "http";
import { waitForActiveRequests } from "@ndla/server";
import { sdk } from "../../instrumentation";
import { log } from "../../util/logger/logger";

export async function gracefulShutdown(server: Server) {
  log.info("Received shutdown signal, shutting down gracefully...");
  if (server) server.close();
  await waitForActiveRequests({ info: log.info.bind(log), warn: log.warn.bind(log) });
  await sdk?.shutdown().catch(() => {});
  process.exit(0);
}
