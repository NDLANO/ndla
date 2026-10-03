/**
 * Copyright (c) 2018-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import { isApiError } from "@ndla/api-client";
import {
  configureKeepAlive,
  createFixedSpanNamingMiddleware,
  createLoggerContextMiddleware,
  createMetricsMiddleware,
  healthRouter,
} from "@ndla/server";
import compression from "compression";
import cors from "cors";
import express, { json } from "express";
import type { GraphQLFormattedError } from "graphql";
import { port } from "./config";
import { resolvers } from "./resolvers";
import { typeDefs } from "./schema";
import { contextExpressMiddleware } from "./utils/context/contextMiddleware";
import { getContextOrThrow } from "./utils/context/contextStore";
import { gracefulShutdown } from "./utils/gracefulShutdown";
import { getLogLevelFromStatusCode, getLogger, logError } from "./utils/logger";
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

const withoutStacktrace = (err: GraphQLFormattedError): GraphQLFormattedError =>
  err.extensions ? { ...err, extensions: { ...err.extensions, stacktrace: undefined } } : err;

const getApiExtensions = (error: unknown) =>
  isApiError(error) ? { status: error.status, json: error.json } : undefined;

const logLevelSeverity = (status: number) => ["info", "warn", "error"].indexOf(getLogLevelFromStatusCode(status));
const getStatus = (errors: { status?: number }[]) => {
  const statuses = errors.map((e) => e.status);
  if (statuses.every((s) => s !== undefined)) {
    return statuses.toSorted((a, b) => logLevelSeverity(b) - logLevelSeverity(a))[0];
  }
  return undefined;
};

const getExtensions = (cause: unknown) => {
  if (cause instanceof AggregateError) {
    const errors = cause.errors.map((e) => {
      const message = e instanceof Error ? e.message : String(e);
      return {
        message,
        ...getApiExtensions(e),
      };
    });
    const status = getStatus(errors);
    return { status, errors };
  }
  return getApiExtensions(cause);
};

async function startApolloServer(): Promise<void> {
  const stopGracePeriodMillis = 20_000;
  const httpServer = configureKeepAlive(createServer(app));
  apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    allowBatchedHttpRequests: true,
    includeStacktraceInErrorResponses: true,
    stopOnTerminationSignals: false,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer, stopGracePeriodMillis })],
    formatError(err, originalError) {
      const cause = unwrapResolverError(originalError);
      const apiExtensions = getExtensions(cause);
      const extensions = err.extensions || apiExtensions ? { ...err.extensions, ...apiExtensions } : undefined;
      const formattedError = {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions,
      };
      logError(formattedError);
      return withoutStacktrace(formattedError);
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
    expressMiddleware(apolloServer, {
      context: async () => getContextOrThrow(),
    }),
  );
  httpServer.listen(GRAPHQL_PORT, () =>
    getLogger().info(`GraphQL Playground is now running on http://localhost:${GRAPHQL_PORT}/graphql-api/graphql`),
  );
}

if (process.env.NODE_ENV === "production") {
  process.on("SIGTERM", () => gracefulShutdown(apolloServer));
}

startApolloServer();
