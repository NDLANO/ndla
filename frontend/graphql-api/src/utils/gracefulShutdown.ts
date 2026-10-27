/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApolloServer } from "@apollo/server";
import { sdk } from "@ndla/shared/instrumentation";
import getLogger from "./logger";

export async function gracefulShutdown(apolloServer: ApolloServer<ContextWithLoaders>) {
  const logger = getLogger();
  logger.info("Received shutdown signal, shutting down gracefully...");
  if (apolloServer) await apolloServer.stop();
  logger.info("Http server drained, exiting.");
  await sdk?.shutdown().catch(() => {});
  process.exit(0);
}
