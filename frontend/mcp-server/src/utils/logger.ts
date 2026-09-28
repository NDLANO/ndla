/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getLoggerContextStore } from "@ndla/server";
import { isSpanContextValid, trace } from "@opentelemetry/api";
import { createLogger, format, transports } from "winston";

const developmentFormat = format.combine(
  format.timestamp(),
  format.printf(({ level, message, stack, requestPath, timestamp }) => {
    const path = typeof requestPath === "string" ? `${requestPath} ` : "";
    const stackString = typeof stack === "string" ? `\n${stack}` : "";
    const text = typeof message === "string" ? message : JSON.stringify(message);
    return `${timestamp} [${level}] ${path}${text}${stackString}`;
  }),
);

const jsonFormat = format.combine(format.timestamp(), format.errors({ stack: true }), format.json());

const requestContextFormat = format((info) => {
  const ctx = getLoggerContextStore();
  if (ctx) {
    info.correlationID = ctx.correlationID;
    info.requestPath = ctx.requestPath;
  }
  const spanContext = trace.getActiveSpan()?.spanContext();
  if (spanContext && isSpanContextValid(spanContext)) {
    info.trace_id = spanContext.traceId;
    info.span_id = spanContext.spanId;
    info.trace_flags = spanContext.traceFlags.toString(16).padStart(2, "0");
  }
  return info;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  defaultMeta: { service: "mcp-server" },
  format: format.combine(
    requestContextFormat(),
    process.env.NODE_ENV === "production" ? jsonFormat : developmentFormat,
  ),
  transports: [new transports.Console()],
});
