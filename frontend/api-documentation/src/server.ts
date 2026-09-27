/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import http from "node:http";
import { configureKeepAlive } from "@ndla/server";
import app from "./app.js";
import config from "./config.js";
import { onBeforeFullReload } from "./utils/devReload.js";
import { log } from "./utils/logger.js";

const rawPort = config.port !== undefined && config.port !== null ? config.port : 3000;
const port: number = typeof rawPort === "string" ? parseInt(rawPort, 10) : rawPort;

const server = configureKeepAlive(http.createServer(app));

server.listen(port, () => {
  log.info(`Listening on ${port}`);
});

onBeforeFullReload(() => {
  server.closeIdleConnections();
  server.close();
});

/**
 * Graceful shutdown on SIGINT / SIGTERM
 */
function shutdown(signal: string) {
  log.info(`${signal} received. Closing server...`);
  server.close((err: Error | undefined) => {
    if (err) {
      log.error("Error during server close", err);
      process.exitCode = 1;
    }
    process.exit();
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default server;
