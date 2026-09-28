/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer } from "node:http";
import { configureKeepAlive, waitForActiveRequests } from "@ndla/server";
import { createApp } from "./app";
import { apiUrl, port } from "./config";
import { logger } from "./utils/logger";

const { app, mcpHandler } = createApp();
const httpServer = configureKeepAlive(createServer(app));

httpServer.listen(port, () => {
  logger.info(`NDLA MCP server listening on http://localhost:${port}/mcp (backend: ${apiUrl})`);
});

const shutdown = async () => {
  logger.info("Received shutdown signal, shutting down gracefully...");
  httpServer.close();
  await waitForActiveRequests({ info: (m) => logger.info(m), warn: (m) => logger.warn(m) });
  await mcpHandler.close();
  logger.info("Http server drained, exiting.");
  process.exit(0);
};

if (process.env.NODE_ENV === "production") {
  process.on("SIGTERM", () => void shutdown());
}
