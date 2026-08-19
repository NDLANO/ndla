/**
 * Copyright (c) 2018-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import {
  createFixedSpanNamingMiddleware,
  createLoggerContextMiddleware,
  createMetricsMiddleware,
  healthRouter,
} from "@ndla/server";
import compression from "compression";
import cors from "cors";
import express, { json } from "express";
import { port } from "./config";
import { resolvers } from "./resolvers";
import { typeDefs } from "./schema";
import { contextExpressMiddleware } from "./utils/context/contextMiddleware";
import { getContextOrThrow } from "./utils/context/contextStore";
import { gracefulShutdown } from "./utils/gracefulShutdown";
import { getLogger, logError } from "./utils/logger";
import loggerMiddleware from "./utils/loggerMiddleware";

const GRAPHQL_PORT = port;

const app = express();

let apolloServer: ApolloServer<ContextWithLoaders>;

const metricsMiddleware = createMetricsMiddleware({
  includeMethod: true,
  includePath: false,
});

app.use(metricsMiddleware);

// compress all responses
app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.use(healthRouter);

async function startApolloServer(): Promise<void> {
  const stopGracePeriodMillis = 20_000;
  const httpServer = createServer(app);
  apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    allowBatchedHttpRequests: true,
    includeStacktraceInErrorResponses: true,
    stopOnTerminationSignals: false,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer, stopGracePeriodMillis })],
    formatError(err) {
      logError(err);
      // Remove stack traces from client response
      const extensions = err?.extensions ? { ...err?.extensions, stacktrace: undefined } : err?.extensions;
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions,
      };
    },
  });
  await apolloServer.start();
  app.use(
    "/graphql-api/graphql",
    cors(),
    json(),
    createFixedSpanNamingMiddleware("/graphql-api/graphql"),
    createLoggerContextMiddleware({ setCorrelationIdLocal: true }),
    contextExpressMiddleware,
    loggerMiddleware,
    expressMiddleware(apolloServer, { context: async () => getContextOrThrow() }),
  );
  httpServer.listen(GRAPHQL_PORT, () =>
    getLogger().info(`GraphQL Playground is now running on http://localhost:${GRAPHQL_PORT}/graphql-api/graphql`),
  );
}

if (process.env.NODE_ENV === "production") {
  process.on("SIGTERM", () => gracefulShutdown(apolloServer));
}

startApolloServer();
