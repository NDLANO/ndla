/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// NOTE: Must be first so OpenTelemetry can instrument `http` and `fetch` before they are loaded/used.
import "@ndla/shared/instrumentation";
import { createServer, type RequestListener, type Server } from "node:http";
import { createReloadingListener } from "@ndla/shared/devReload";
import { configureKeepAlive } from "@ndla/shared/server";
import type { ServerBuild } from "react-router";
import config from "./config";
import type * as AppModule from "./server/app";
import { gracefulShutdown } from "./server/helpers/gracefulShutdown";
import { log } from "./util/logger/logger";

const createApp = async (server: Server): Promise<RequestListener> => {
  if (import.meta.env.PROD) {
    const [{ createApp }, build] = await Promise.all([
      import("./server/app"),
      import("virtual:react-router/server-build"),
    ]);
    return createApp({ build });
  } else {
    // The app and the React Router build are loaded through Vite, so they share one module graph and pick up changes.
    // oxlint-disable-next-line import-js/no-extraneous-dependencies
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true, ws: { server } }, appType: "custom" });
    return createReloadingListener<typeof AppModule>(vite, "./src/server/app.ts", ({ createApp }) =>
      createApp({
        vite,
        build: () => vite.ssrLoadModule("virtual:react-router/server-build") as Promise<ServerBuild>,
      }),
    );
  }
};

const server = configureKeepAlive(createServer());
const app = await createApp(server);

if (!config.isVercel) {
  server.on("request", app);
  server.listen(config.port, () => {
    log.info(`> Started on port ${config.port}`);
  });
  process.on("SIGTERM", () => gracefulShutdown(server));
}

export default app;
