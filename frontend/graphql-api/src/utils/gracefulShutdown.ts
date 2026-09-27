/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApolloServer } from "@apollo/server";
import { log } from "./logger";

export async function gracefulShutdown(apolloServer: ApolloServer<ContextWithLoaders>) {
  log.info("Received shutdown signal, shutting down gracefully...");
  if (apolloServer) await apolloServer.stop();
  log.info("Http server drained, exiting.");
  process.exit(0);
}
