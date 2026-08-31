/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from "node:path";
import cors from "cors";
import express, { type Request, type Response } from "express";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ApiListPage, type ApiRoute } from "./components/ApiListPage.js";
import { ErrorPage } from "./components/ErrorPage.js";
import { SwaggerPage } from "./components/SwaggerPage.js";
import config from "./config.js";
import { onBeforeFullReload } from "./utils/devReload.js";
import { getAppropriateErrorResponse } from "./utils/errorHelpers.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));

if (import.meta.env.PROD) {
  const staticDir = path.join(import.meta.dirname, "public", "static");
  app.use("/static", express.static(staticDir, { maxAge: 5 * 60 * 1000, index: false }));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", base: "/" });
  app.use(vite.middlewares);
  onBeforeFullReload(() => void vite.close());
}

app.get("/swagger", (_req: Request, res: Response) => {
  res.send(renderPage(<SwaggerPage personalClientId={config.auth0PersonalClientId} />));
});

app.get("/advanced/swagger", (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const redirectUrl = query ? `/swagger?${query}` : "/swagger";
  res.redirect(redirectUrl);
});

const jsonIsApiRoute = (obj: unknown): obj is ApiRoute => {
  if (
    obj &&
    typeof obj === "object" &&
    "name" in obj &&
    "paths" in obj &&
    typeof obj.name === "string" &&
    Array.isArray(obj.paths)
  ) {
    return true;
  }
  return false;
};

let generatedRoutes: ApiRoute[] | null = null;

const generateApiDocsRoutes = async (): Promise<ApiRoute[]> => {
  const parsed = JSON.parse(config.endpoints_json);
  if (Array.isArray(parsed) && parsed.every(jsonIsApiRoute)) {
    if (parsed.length > 0) return parsed;
  }

  throw new Error("No valid API routes found");
};

const renderPage = (page: ReactNode): string => `<!doctype html>\n${renderToStaticMarkup(page)}`;

const withTemplate = async (swaggerPath: string, _req: Request, res: Response): Promise<void> => {
  try {
    if (!generatedRoutes) {
      generatedRoutes = await generateApiDocsRoutes();
    }
    res.send(renderPage(<ApiListPage path={swaggerPath} routes={generatedRoutes} />));
  } catch (error: unknown) {
    const response = getAppropriateErrorResponse(
      error as Error & { status?: number; json?: object },
      config.isProduction,
    );
    res.status(response.status).send(renderPage(<ErrorPage {...response} />));
  }
};

app.get("/", (req: Request, res: Response) => {
  void withTemplate("/", req, res);
});

app.get("/advanced", (_req: Request, res: Response) => {
  void res.redirect("/");
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: 200, text: "Health check ok" });
});

app.get("/robots.txt", (_: Request, res: Response) => {
  res.type("text/plain");
  res.send("User-agent: *\nAllow: /\n Disallow: /*/");
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 404, text: "Not found" });
});

export default app;
