/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CombinedGraphQLErrors, type ErrorLike } from "@apollo/client";
import { getLogLevelFromStatusCode, logError, type LogLevel, mergeLogLevels, NDLAError } from "@ndla/shared";
import { captureError } from "@ndla/shared/sentry";
import type { GraphQLFormattedError } from "graphql";
import { FORBIDDEN, GONE, NOT_FOUND, UNAUTHORIZED } from "../statusCodes";
import { log } from "./logger/logger";

type UnknownError = {
  status?: number;
};

const getErrorStatuses = (error: unknown): number[] => {
  const statuses: number[] = [];
  if (error == null) return statuses;
  const unknownError = error as UnknownError;
  if (unknownError.status) {
    statuses.push(unknownError.status);
  } else if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach((e) => {
      const unknownError = e as UnknownError;
      if (unknownError.status) {
        statuses.push(unknownError.status);
        return;
      }
      if (typeof e.extensions?.status === "number") {
        statuses.push(e.extensions.status);
      }
    });
  }
  return statuses;
};

export const AccessDeniedCodes = [UNAUTHORIZED, FORBIDDEN];

const hasStatus = (error: ErrorLike | undefined | null, errorCodes: number[]): boolean =>
  getErrorStatuses(error).some((status) => errorCodes.includes(status));

export const hasAccessDeniedStatus = (error: ErrorLike | undefined | null) => hasStatus(error, AccessDeniedCodes);

export const findAccessDeniedErrors = (error: ErrorLike | undefined | null): GraphQLFormattedError[] => {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.filter((err) => {
      // not sure if `err.status` ever exists
      const code = (err as any).status ?? err.extensions?.status;
      return AccessDeniedCodes.includes(code ?? 0);
    });
  }
  return [];
};

export const hasNotFoundStatus = (error: ErrorLike | undefined | null) => hasStatus(error, [NOT_FOUND]);

export const hasGoneStatus = (error: ErrorLike | undefined | null) => hasStatus(error, [GONE]);

export const deriveLogLevel = (error: unknown): LogLevel | undefined => {
  if (error instanceof NDLAError) return error.logLevel;
  return mergeLogLevels(getErrorStatuses(error).map(getLogLevelFromStatusCode));
};

export const handleError = (error: unknown, extraContext: Record<string, unknown> = {}) => {
  if (import.meta.env.SSR) {
    logError(log, error, extraContext, deriveLogLevel(error));
  } else {
    captureError(error, extraContext);
    console.error(error); // oxlint-disable-line no-console
  }
};
