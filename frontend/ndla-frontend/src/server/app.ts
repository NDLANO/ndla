/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from "node:path";
import { activeRequestsMiddleware, createLoggerContextMiddleware, healthRouter } from "@ndla/server";
import { getCookie } from "@ndla/util";
import { createRequestHandler } from "@react-router/express";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { matchPath, type ServerBuild } from "react-router";
import sirv from "sirv";
import type { ViteDevServer } from "vite";
import config from "../config";
import { NOT_FOUND_PAGE_PATH, SESSION_EXPIRY_COOKIE } from "../constants";
import { getLocaleInfoFromPath } from "../i18n";
import { authenticatedRoutes, privateRoutes } from "../routePaths";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../statusCodes";
import { isActiveSession } from "../util/authHelpers";
import { handleError } from "../util/handleError";
import api from "./api";
import { contentSecurityPolicy } from "./contentSecurityPolicy";
import { installCorrelationIdFetch } from "./correlationFetch";
import { isRestrictedMode } from "./helpers/restrictedMode";
import { parseLtiLaunch } from "./ltiLaunch";
import { metricsMiddleware } from "./middleware/metricsMiddleware";
import { spanNamingMiddleware } from "./middleware/spanNamingMiddleware";
import { getLoadContext } from "./requestInfo";

interface AppOptions {
  build: ServerBuild | (() => Promise<ServerBuild>);
  vite?: ViteDevServer;
}

global.fetch = fetch;
installCorrelationIdFetch();

const allowedBodyContentTypes = ["application/json", "application/x-www-form-urlencoded"];

const articleIframePaths = [
  "/article-iframe/:lang/article/:articleId",
  "/article-iframe/:lang/:taxonomyId/:articleId",
  "/article-iframe/article/:articleId",
  "/article-iframe/:taxonomyId/:articleId",
];

const embedIframePaths = ["/embed-iframe/:embedType/:embedId", "/embed-iframe/:lang/:embedType/:embedId"];

/** Requests React Router makes for its own data, which carry their own caching headers. */
const isRouterDataRequest = (req: Request) => req.path === "/__manifest" || req.path.endsWith(".data");

const applyRestrictedModeCacheHeader = (req: Request, res: Response) => {
  if (isRouterDataRequest(req)) return;
  const { restricted } = isRestrictedMode(req);
  if (restricted) {
    res.setHeader("Cache-Control", "no-store");
  }
};

const setPublicCache = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  next();
};

/**
 * These pages are rendered the same way whether they are fetched or posted to, and a form post from another site
 * is how they are embedded. React Router only accepts posts for route actions, so they are rendered as a GET.
 */
const renderAsGet = (req: Request, _res: Response, next: NextFunction) => {
  req.method = "GET";
  next();
};

const getStatusCodeToReturn = (err?: Error): number => {
  if (err && "status" in err && typeof err.status === "number") {
    if (err.status >= 400 && err.status < 600) return err.status;
  }
  return INTERNAL_SERVER_ERROR;
};

export const createApp = ({ build, vite }: AppOptions) => {
  const app = express();

  app.disable("x-powered-by");
  app.enable("trust proxy");

  if (vite) {
    app.use(vite.middlewares);
  } else if (!config.isVercel) {
    const clientDir = path.join(process.cwd(), "build", "client");
    app.use(
      "/assets",
      sirv(path.join(clientDir, "assets"), {
        extensions: [],
        maxAge: 31536000, // Only use long TTL for assets, since they have hash in filename
        immutable: true,
      }),
    );
    app.use(
      "/",
      sirv(clientDir, {
        extensions: [],
        etag: true,
        maxAge: 5 * 60,
      }),
    );
  }

  app.use(metricsMiddleware);
  app.use(activeRequestsMiddleware);
  app.use(createLoggerContextMiddleware());
  app.use(spanNamingMiddleware);

  app.use(express.urlencoded({ extended: true }));
  app.use(
    express.json({
      type: (req) => allowedBodyContentTypes.includes(req.headers["content-type"] ?? ""),
    }),
  );

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      referrerPolicy: {
        policy: ["origin", "no-referrer-when-downgrade"],
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
      contentSecurityPolicy,
      xFrameOptions: false,
    }),
  );

  app.use(api);
  app.use(healthRouter);

  app.get("/build-id", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ buildId: config.componentVersion });
  });

  app.get(embedIframePaths, setPublicCache);
  app.get(articleIframePaths, setPublicCache);
  app.get("/lti", setPublicCache);

  app.get(["/", "/*splat"], (req, res, next) => {
    if (res.getHeader("Cache-Control") || isRouterDataRequest(req)) {
      return next();
    }
    const { basepath: path, basename } = getLocaleInfoFromPath(req.path);
    const isPrivate = privateRoutes.some((r) => matchPath(r, path));
    res.setHeader("Cache-Control", isPrivate ? "private, no-store" : "public, max-age=300");
    const requiresAuth = authenticatedRoutes.some((r) => matchPath(r, path));
    const isValidSession = isActiveSession(getCookie(SESSION_EXPIRY_COOKIE, req.headers.cookie ?? ""));

    if (requiresAuth && !isValidSession) {
      applyRestrictedModeCacheHeader(req, res);
      const basenamePrefix = basename ? `/${basename}` : "";
      return res.redirect(`${basenamePrefix}/login?returnTo=${req.path}`);
    }
    return next();
  });

  app.post(articleIframePaths, setPublicCache, renderAsGet);
  app.post("/lti", (req, res, next) => {
    const launch = parseLtiLaunch(req.body);
    if (!launch.valid) {
      applyRestrictedModeCacheHeader(req, res);
      res.status(BAD_REQUEST).send(launch.error);
      return;
    }
    res.locals.ltiData = launch.ltiData;
    renderAsGet(req, res, next);
  });
  app.post("/*splat", (_req, res) => {
    res.redirect(NOT_FOUND_PAGE_PATH);
  });

  app.use((req, res, next) => {
    applyRestrictedModeCacheHeader(req, res);
    next();
  });

  app.use(createRequestHandler({ build, getLoadContext }));

  // NOTE: The error handler should be defined after all middlewares and routes
  //       according to the express documentation
  //       https://expressjs.com/en/guide/error-handling.html#writing-error-handlers
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    // NOTE: Even though the next parameter is not used, it is required to define the error handler
    vite?.ssrFixStacktrace(err);
    const statusCode = getStatusCodeToReturn(err);
    handleError(err, { statusCode });
    if (res.headersSent) {
      res.end();
      return;
    }
    applyRestrictedModeCacheHeader(req, res);
    if (res.getHeader("Content-Type") === "application/json") {
      res.status(statusCode).json("Internal server error");
    } else {
      res.status(statusCode).send("Internal server error");
    }
  });

  return app;
};
