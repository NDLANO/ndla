/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getErrorLog, type Logger, type LogLevel } from "@ndla/shared";
import { isSpanContextValid, trace } from "@opentelemetry/api";
import pc from "picocolors";
import type { Formatter } from "picocolors/types";
import winston from "winston";
import { getLoggerContextStore } from "./loggerContextMiddleware";

export interface CreateLoggerOptions {
  service: string;
  json?: boolean;
  level?: string;
  transports?: winston.LoggerOptions["transports"];
}

const contextFormat = winston.format((info) => {
  const loggerContext = getLoggerContextStore();
  if (loggerContext) {
    info.correlationID ??= loggerContext.correlationID;
    info.requestPath ??= loggerContext.requestPath;
  }

  const ctx = trace.getActiveSpan()?.spanContext();
  if (ctx && isSpanContextValid(ctx)) {
    info.trace_id = ctx.traceId;
    info.span_id = ctx.spanId;
    info.trace_flags = ctx.traceFlags.toString(16).padStart(2, "0");
  }
  return info;
});

const logLevelColors: Record<string, Formatter> = {
  error: pc.red,
  warn: pc.yellow,
  info: pc.blue,
};

const indentString = (str: string): string => {
  return str
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
};

const prettyFormat = winston.format.printf((info) => {
  const {
    level,
    message,
    timestamp,
    stack,
    requestPath,
    service: _service,
    correlationID: _correlationID,
    trace_id: _traceId,
    span_id: _spanId,
    trace_flags: _traceFlags,
    ...rest
  } = info;
  const colorFunc = logLevelColors[level] ?? pc.white;
  const coloredLevel = colorFunc(pc.bold(level.toUpperCase()));
  const path = typeof requestPath === "string" ? ` ${requestPath}` : "";
  let logLine = `[${coloredLevel}] ${timestamp}${path}: ${message}`;

  if (typeof stack === "string") logLine += `\n${indentString(stack)}`;
  if (Object.keys(rest).length > 0) logLine += `\n${indentString(JSON.stringify(rest, null, 2))}`;

  return logLine;
});

const errorToObject = (error: Error): Record<string, unknown> => {
  const errorLog = getErrorLog(error);
  return typeof errorLog === "string" ? { message: errorLog } : { ...errorLog };
};

/** Since errors are kind of special in javascript we do some extra logic to find potential error data to be logged */
const findErrorInMeta = (meta: unknown[]): { error: Error | undefined; rest: unknown[] } => {
  for (const [i, item] of meta.entries()) {
    if (item instanceof Error) {
      return { error: item, rest: meta.toSpliced(i, 1) };
    } else if (typeof item === "object" && item !== null) {
      const error = Object.values(item).find((value) => value instanceof Error);
      if (error instanceof Error) {
        return { error, rest: meta.toSpliced(i, 1) };
      }
    }
  }
  return { error: undefined, rest: meta };
};

const getMeta = (meta: unknown[]): Record<string, unknown> => {
  if (meta.length === 0) return {};
  const entries = meta.map((m) => toLogEntry(m, []));
  return { logMeta: entries.length === 1 ? entries[0] : Object.assign({}, ...entries) };
};

export const toLogEntry = (message: unknown, meta: unknown[]): Record<string, unknown> => {
  if (message instanceof Error) {
    return { ...getMeta(meta), ...errorToObject(message) };
  }

  const { error, rest } = findErrorInMeta(meta);
  const errorEntry = error ? errorToObject(error) : {};
  if (typeof message === "object" && message !== null) return { ...getMeta(rest), ...errorEntry, ...message };
  return { ...getMeta(rest), ...errorEntry, message };
};

export const createLogger = ({
  service,
  json = process.env.NODE_ENV === "production",
  level = process.env.LOG_LEVEL ?? "info",
  transports = [new winston.transports.Console()],
}: CreateLoggerOptions): Logger => {
  const format = json
    ? winston.format.combine(contextFormat(), winston.format.timestamp(), winston.format.json())
    : winston.format.combine(contextFormat(), winston.format.timestamp(), prettyFormat);

  const winstonLogger = winston.createLogger({ level, defaultMeta: { service }, format, transports });

  const log = (level: LogLevel, message: unknown, ...meta: unknown[]) => {
    winstonLogger.log(level, toLogEntry(message, meta));
  };

  return {
    log,
    info: (message, ...meta) => log("info", message, ...meta),
    warn: (message, ...meta) => log("warn", message, ...meta),
    error: (message, ...meta) => log("error", message, ...meta),
  };
};
