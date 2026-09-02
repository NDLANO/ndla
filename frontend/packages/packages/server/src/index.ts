/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { activeRequestsMiddleware, getActiveRequests, waitForActiveRequests } from "./activeRequestsMiddleware";
export type { WaitForActiveRequestsOptions } from "./activeRequestsMiddleware";
export {
  buildFeideLogoutUrl,
  completeFeideLogin,
  FEIDE_DISCOVERY_URL,
  FEIDE_SCOPES,
  feideTokenExpiry,
  getFeideOidcConfig,
  startFeideLogin,
  upsertMyNdlaUser,
} from "./feideAuth";
export type {
  CompleteFeideLoginOptions,
  FeideLoginHandshake,
  FeideLogoutOptions,
  FeideTokens,
  StartFeideLoginOptions,
  UpsertMyNdlaUserOptions,
} from "./feideAuth";
export { healthRouter } from "./healthRouter";
export {
  createLoggerContextMiddleware,
  getCorrelationId,
  getLoggerContextStore,
  withLoggerContext,
} from "./loggerContextMiddleware";
export type { LoggerContext, LoggerContextMiddlewareOptions } from "./loggerContextMiddleware";
export { createMetricsMiddleware, getExpressRoutePaths, normalizeExpressRoutePath } from "./metricsMiddleware";
export type { MetricsMiddlewareOptions } from "./metricsMiddleware";
export {
  createFixedSpanNamingMiddleware,
  createSpanNamingMiddleware,
  getFirstPathSegmentRouteName,
} from "./spanNamingMiddleware";
export type { RouteNameResolver } from "./spanNamingMiddleware";
export { safeReturnPath } from "./safeReturnPath";
