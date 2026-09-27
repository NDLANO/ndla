/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isApiError } from "@ndla/api-client";
import { NDLAError, StatusError } from "./errors";

const getMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (error instanceof AggregateError) {
    const aggregateMessages = error.errors.map((e) => {
      const message = getMessage(e);
      const stack = e.stack ? `Stack: ${e.stack}` : "";
      return `${message} ${stack}`;
    });
    return `AggregateError with errors: [${aggregateMessages}]`;
  }
  if (typeof error === "string" && error) return error;
  return "Got error without message";
};

const getStatus = (context: Record<string, unknown>, error: unknown): number | undefined => {
  if (typeof context.statusCode === "number") return context.statusCode;
  if (error instanceof StatusError) return error.status;
  if (error instanceof Error && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
};

// Node/undici expose the actual failure reason as own (often non-enumerable) properties that
// `JSON.stringify` would otherwise drop. These turn a bare "fetch failed" into something diagnosable.
const ERROR_DETAIL_KEYS = [
  "code",
  "errno",
  "syscall",
  "address",
  "port",
  "hostname",
  "requestUrl",
  "requestMethod",
] as const;

type ErrorDetailKey = (typeof ERROR_DETAIL_KEYS)[number];
type ErrorDetails = Partial<Record<ErrorDetailKey, unknown>>;
type ErrorWithMaybeDetails = Error & ErrorDetails;

const pickErrorDetails = (error: ErrorWithMaybeDetails): Record<string, unknown> => {
  const details: ErrorDetails = {};
  for (const key of ERROR_DETAIL_KEYS) {
    const value = error[key];
    if (value !== undefined) details[key] = value;
  }
  return details;
};

const MAX_CAUSE_DEPTH = 5;

/** undici hides the real failure behind a generic "fetch failed" `TypeError`, with the reason
 * (ENOTFOUND, ECONNREFUSED, timeouts, TLS errors ...) living in `error.cause` — frequently an
 * `AggregateError` whose `errors` hold the per-address details. Recursively serialise that chain so
 * the logs actually say what went wrong. */
const serializeCause = (error: unknown, depth = 0): unknown => {
  if (error == null || depth > MAX_CAUSE_DEPTH) return undefined;
  if (!(error instanceof Error)) {
    // objects are returned as-is just below, so this only ever stringifies a primitive
    // oxlint-disable-next-line typescript/no-base-to-string
    if (typeof error !== "object") return String(error);
    return error;
  }
  const result: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    ...pickErrorDetails(error),
  };
  if (error instanceof AggregateError && Array.isArray(error.errors)) {
    result.errors = error.errors.map((e) => serializeCause(e, depth + 1));
  }
  const cause = serializeCause(error.cause, depth + 1);
  if (cause !== undefined) result.cause = cause;
  return result;
};

export const getErrorLog = (error: unknown, extraContext: Record<string, unknown> = {}): object | string => {
  const context = { ...extraContext, ...(error instanceof NDLAError ? error.logContext : {}) };
  const ctx: Record<string, unknown> = {
    ...context,
    statusCode: getStatus(context, error),
  };
  if (!error) return { ...ctx, message: `Unknown error: ${JSON.stringify(error)}` };

  const withCause = (base: Record<string, unknown>, err: Error): Record<string, unknown> => {
    const cause = serializeCause(err.cause ?? ctx.cause);
    if (cause !== undefined) base.cause = cause;
    return base;
  };

  if (error instanceof StatusError || isApiError(error)) {
    return withCause(
      {
        ...ctx,
        message: getMessage(error),
        json: error.json,
        status: error.status,
        stack: error.stack,
        name: error.name,
        ...pickErrorDetails(error),
      },
      error,
    );
  }

  if (error instanceof Error) {
    return withCause(
      {
        ...ctx,
        message: getMessage(error),
        stack: error.stack,
        name: error.name,
        ...pickErrorDetails(error),
      },
      error,
    );
  }

  if (typeof error === "object") {
    return { ...error, ...ctx, message: getMessage(error) };
  }

  if (typeof error === "string") {
    return { ...ctx, message: getMessage(error) };
  }

  return error;
};

export const ensureError = (unknownError: unknown): Error => {
  if (unknownError instanceof Error) return unknownError;
  return new NDLAError(String(unknownError));
};
