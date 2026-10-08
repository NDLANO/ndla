/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from "node:path";
import {
  activeRequestsMiddleware,
  createLoggerContextMiddleware,
  createMetricsMiddleware,
  createSpanNamingMiddleware,
  getFirstPathSegmentRouteName,
  healthRouter,
} from "@ndla/server";
import { getCookie } from "@ndla/util";
import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import type { ServerBuild } from "react-router";
import sirv from "sirv";
import type { ViteDevServer } from "vite";
import config from "../config";
import { ACCESS_TOKEN_COOKIE, HAS_REFRESH_TOKEN_COOKIE } from "../constants";
import api from "./api";
import authEndpoints, { refreshAccessToken } from "./authEndpoints";
import contentSecurityPolicy from "./contentSecurityPolicy";
import { installCorrelationIdFetch } from "./correlationFetch";
import { INTERNAL_SERVER_ERROR } from "./httpCodes";
import log from "./logger";
import { getLoadContext } from "./requestInfo";

interface AppOptions {
  build: ServerBuild | (() => Promise<ServerBuild>);
  vite?: ViteDevServer;
}

installCorrelationIdFetch();

const allowedBodyContentTypes = ["application/csp-report", "application/json"];

/** Requests React Router makes for its own data, which carry their own caching headers. */
const isRouterDataRequest = (req: Request) => req.path === "/__manifest" || req.path.endsWith(".data");

export const createApp = ({ build, vite }: AppOptions) => {
  const app = express();

  if (vite) {
    app.use(vite.middlewares);
  } else if (!config.isVercel) {
    const clientDir = path.join(process.cwd(), "build", "client");
    // Only use long TTL for assets, since they have hash in filename
    app.use("/assets", sirv(path.join(clientDir, "assets"), { extensions: [], maxAge: 31536000, immutable: true }));
    app.use("/", sirv(clientDir, { extensions: [], etag: true, maxAge: 5 * 60 }));
  }

  const metricsMiddleware = createMetricsMiddleware();
  const spanNamingMiddleware = createSpanNamingMiddleware((req) => getFirstPathSegmentRouteName(req.path));

  app.use(metricsMiddleware);
  app.use(activeRequestsMiddleware);
  app.use(createLoggerContextMiddleware());
  app.use(spanNamingMiddleware);

  app.use(healthRouter);

  // Temporal hack to send users to prod
  app.get("*splat", (req, res, next) => {
    if (!req.hostname.includes("ed.ff")) {
      next();
    } else {
      res.set("location", `https://ed.ndla.no${req.originalUrl}`);
      res.status(302).send();
    }
  });

  if (!config.isVercel) {
    app.use(compression());
  }

  app.use(
    express.json({
      limit: "1mb",
      type: (req) => {
        for (const allowedType of allowedBodyContentTypes) {
          if ((req as express.Request).is(allowedType)) {
            return true;
          }
        }
        return false;
      },
    }),
  );

  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
      contentSecurityPolicy: config.disableCSP === "true" ? false : contentSecurityPolicy,
    }),
  );

  app.use(api);
  app.use(authEndpoints);

  app.get(["/", "/*splat"], async (req, res, next) => {
    if (isRouterDataRequest(req)) {
      return next();
    }
    // We automatically refresh access tokens on ssr requests, so we need to ensure that the initial response is not cached.
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Reporting-Endpoints", `csp-endpoint="${config.editorialFrontendDomain}/csp-reporting"`);

    const token = getCookie(ACCESS_TOKEN_COOKIE, req.headers.cookie ?? "");
    if (!token && getCookie(HAS_REFRESH_TOKEN_COOKIE, req.headers.cookie ?? "") === "true") {
      try {
        res.locals.accessToken = await refreshAccessToken(req, res);
      } catch (e) {
        log.error("Failed to refresh token on SSR request:", e);
      }
    }
    next();
  });

  app.use(createRequestHandler({ build, getLoadContext }));

  // NOTE: The error handler must be defined after all other middlewares and routes.
  //       https://expressjs.com/en/guide/error-handling.html#writing-error-handlers
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    vite?.ssrFixStacktrace(err);
    log.error("Unhandled error", err);
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(INTERNAL_SERVER_ERROR).send("Internal server error");
  });

  return app;
};
