/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// NOTE: Must be first so OpenTelemetry can instrument `http` and `fetch` before they are loaded/used.
import "./instrumentation";
import { configureKeepAlive, type Metrics } from "@ndla/server";
import type { Express } from "express";
import type { ServerBuild } from "react-router";
import config from "./config";
import type * as AppModule from "./server/app";
import { gracefulShutdown } from "./server/helpers/gracefulShutdown";
import { log } from "./util/logger/logger";

const createApp = async (): Promise<{ app: Express; metrics: Metrics }> => {
  if (import.meta.env.PROD) {
    const [{ createApp, metrics }, build] = await Promise.all([
      import("./server/app"),
      import("virtual:react-router/server-build"),
    ]);
    return { app: createApp({ build }), metrics };
  } else {
    // The app and the React Router build are loaded through Vite, so they share one module graph and pick up changes.
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
    const { createApp, metrics } = (await vite.ssrLoadModule("./src/server/app.ts")) as typeof AppModule;
    const app = createApp({
      vite,
      build: () => vite.ssrLoadModule("virtual:react-router/server-build") as Promise<ServerBuild>,
    });
    return { app, metrics };
  }
};

const { app, metrics } = await createApp();

if (!config.isVercel) {
  const server = configureKeepAlive(
    app.listen(config.port, () => {
      log.info(`> Started on port ${config.port}`);
    }),
  );
  metrics.listen(config.metricsPort, () => {
    log.info(`> Metrics exposed on port ${config.metricsPort}`);
  });
  process.on("SIGTERM", () => gracefulShutdown(server));
}

export default app;
