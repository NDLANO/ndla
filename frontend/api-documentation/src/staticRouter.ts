/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRequire } from "node:module";
import path from "node:path";
import express, { type Request, type Response } from "express";
import { onBeforeFullReload } from "./utils/devReload.js";

const STATIC_MAX_AGE_MS = 5 * 60 * 1000;

export const staticRouter = express.Router();

if (import.meta.env.PROD) {
  const staticDir = path.join(import.meta.dirname, "public", "static");
  staticRouter.use("/static", express.static(staticDir, { maxAge: STATIC_MAX_AGE_MS, index: false }));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", base: "/" });
  staticRouter.use(vite.middlewares);
  onBeforeFullReload(() => void vite.close());
}

// We need to serve these files from the `swagger-ui-dist` package because we redirect to them directly
const swaggerUiDistDir = path.dirname(createRequire(import.meta.url).resolve("swagger-ui-dist"));
for (const file of ["oauth2-redirect.html", "oauth2-redirect.js"]) {
  staticRouter.get(`/static/${file}`, (_req: Request, res: Response) => {
    const filePath = path.join(swaggerUiDistDir, file);
    res.sendFile(filePath, { maxAge: STATIC_MAX_AGE_MS, dotfiles: "allow" });
    return;
  });
}
