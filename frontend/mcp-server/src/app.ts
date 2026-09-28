/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { hostHeaderValidation, toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import {
  activeRequestsMiddleware,
  createFixedSpanNamingMiddleware,
  createLoggerContextMiddleware,
  createMetricsMiddleware,
  healthRouter,
} from "@ndla/server";
import cors from "cors";
import express, { type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { allowedHosts, rateLimitPerMinute, trustProxy } from "./config";
import { buildServer } from "./mcpServer";
import { logger } from "./utils/logger";

const MCP_PATH = "/mcp";

const infoText = `This is NDLA's MCP server (Model Context Protocol). Add this URL as a remote MCP server / custom connector in your AI assistant (e.g. Claude, ChatGPT, Cursor or VS Code) to search and read NDLA's learning resources. No login is needed.`;

const hostValidation = (): RequestHandler => {
  if (!allowedHosts.length) return (_req, _res, next) => next();
  const isAllowed = hostHeaderValidation(allowedHosts);
  return (req, res, next) => {
    if (isAllowed(req, res)) next();
  };
};

const rateLimiter = (): RequestHandler => {
  if (rateLimitPerMinute <= 0) return (_req, _res, next) => next();
  return rateLimit({
    windowMs: 60_000,
    limit: rateLimitPerMinute,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { jsonrpc: "2.0", id: null, error: { code: -32000, message: "Too many requests, slow down." } },
  });
};

/** Browsers opening the URL get a short explanation instead of a protocol error. */
const browserInfo: RequestHandler = (req, res, next) => {
  if (req.method === "GET" && !req.headers.accept?.includes("text/event-stream")) {
    res.type("text/plain").send(infoText);
    return;
  }
  next();
};

export const createApp = () => {
  const mcpHandler = createMcpHandler(buildServer, {
    onerror: (error) => logger.warn(`MCP request error: ${error.message}`),
  });
  const handleMcpRequest = toNodeHandler(mcpHandler, {
    onerror: (error) => logger.error("MCP handler failed", { error: { message: error.message, stack: error.stack } }),
  });

  const app = express();
  if (trustProxy !== undefined) app.set("trust proxy", trustProxy);
  app.disable("x-powered-by");
  app.use(createMetricsMiddleware({ includeMethod: true, includePath: false }));
  app.use(healthRouter);
  app.use(activeRequestsMiddleware);

  app.all(
    MCP_PATH,
    cors({ origin: "*", exposedHeaders: ["Mcp-Protocol-Version", "Mcp-Session-Id", "WWW-Authenticate"] }),
    hostValidation(),
    browserInfo,
    rateLimiter(),
    express.json({ limit: "100kb" }),
    createFixedSpanNamingMiddleware(MCP_PATH),
    createLoggerContextMiddleware(),
    (req, res) => void handleMcpRequest(req, res, req.body),
  );

  return { app, mcpHandler };
};
