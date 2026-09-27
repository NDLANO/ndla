/**
 * Copyright (c) 2018-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { IncomingHttpHeaders } from "node:http2";
import { createLogger } from "@ndla/server";
import { getLogLevelFromStatusCode, type LogLevel } from "@ndla/shared";
import type { GraphQLFormattedError } from "graphql/error/GraphQLError";
import { getContext } from "./context/contextStore";

export const log = createLogger({ service: "graphql-api" });

const getLogLevelFromError = (err: GraphQLFormattedError): LogLevel => {
  const status = err.extensions?.status;
  return typeof status === "number" ? getLogLevelFromStatusCode(status) : "error";
};

const sensorHeaders = (headers: IncomingHttpHeaders): IncomingHttpHeaders => {
  const { authorization, feideauthorization, ...rest } = headers;
  return {
    ...rest,
    authorization: authorization ? "<REDACTED>" : undefined,
    feideauthorization: feideauthorization ? "<REDACTED>" : undefined,
  };
};

const getErrorLog = (err: GraphQLFormattedError) => {
  const ctx = getContext();
  const context = ctx
    ? {
        requestPath: ctx.req.url,
        requestBody: ctx.req.body,
        requestHeaders: sensorHeaders(ctx.req.headers),
      }
    : {};

  const { message, locations, path, extensions } = err;
  const { stacktrace, ...otherExtensions } = extensions ?? {};
  return {
    message,
    locations,
    path,
    extensions: extensions ? otherExtensions : undefined,
    stack: Array.isArray(stacktrace) ? stacktrace.join("\n") : undefined,
    ...context,
  };
};

export const logGraphQLError = (err: GraphQLFormattedError) => {
  log.log(getLogLevelFromError(err), getErrorLog(err));
};
