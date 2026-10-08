/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This is the entry point of the application.

// NOTE: Must be first so OpenTelemetry can instrument `http` and `fetch` before they are loaded/used.
import "./instrumentation";
import { configureKeepAlive } from "@ndla/server";
import type { Express } from "express";
import type { ServerBuild } from "react-router";
import config from "./config";
import type * as AppModule from "./server/app";
import { gracefulShutdown } from "./server/gracefulShutdown";
import log from "./server/logger";

const createApp = async (): Promise<Express> => {
  if (import.meta.env.PROD) {
    const [{ createApp }, build] = await Promise.all([
      import("./server/app"),
      import("virtual:react-router/server-build"),
    ]);
    return createApp({ build });
  } else {
    // The app and the React Router build are loaded through Vite, so they share one module graph and pick up changes.
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
    const { createApp } = (await vite.ssrLoadModule("./src/server/app.ts")) as typeof AppModule;
    return createApp({
      vite,
      build: () => vite.ssrLoadModule("virtual:react-router/server-build") as Promise<ServerBuild>,
    });
  }
};

const app = await createApp();

if (!config.isVercel) {
  const server = configureKeepAlive(
    app.listen(config.port, () => {
      log.info(`Server started at http://localhost:${config.port}`);
    }),
  );

  process.on("SIGTERM", () => gracefulShutdown(server));
}

export default app;
