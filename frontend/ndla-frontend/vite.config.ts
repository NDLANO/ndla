/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import { gqlPlugin } from "vite-plugin-graphql-tag";
import { defineNdlaConfig, ndlaJsdomTest, ndlaSentryPlugin } from "../vite.config.base.mts";

export default defineNdlaConfig(
  ({ command }) => ({
    test: ndlaJsdomTest(),
    plugins: [
      gqlPlugin({ strip: true }),
      process.env.VITEST ? react() : reactRouter(),
      ndlaSentryPlugin("ndla-frontend"),
    ],
    server: {
      warmup: {
        ssrFiles: ["./src/entry.server.tsx"],
        clientFiles: ["./src/entry.client.tsx", "./src/root.tsx"],
      },
    },
    // We bundle Apollo in dev in order for it to detect that we are in dev mode.
    // React Router must be bundled to ensure that client and SSR use the same build, in order for the `RouterContextProvider` to work.
    ssr: { noExternal: command === "build" ? true : ["@apollo/client", "@react-router/express"] },
    // Avoids a reload on the first load after starting dev server, caused by the bundling of Apollo above
    optimizeDeps: { include: ["graphql", "graphql-tag", "rxjs"] },
    build: { cssCodeSplit: false },
    environments: { ssr: { build: { rolldownOptions: { input: "./src/server.ts" } } } },
  }),
  { outputLayout: false },
);
