/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Server } from "node:http";

/** Backend keeps pooled upstream connections far than longer default node, so would regularly reuse a connection node just closed by default. */
export const configureKeepAlive = (server: Server): Server => {
  server.keepAliveTimeout = 61 * 60 * 1000;
  return server;
};
