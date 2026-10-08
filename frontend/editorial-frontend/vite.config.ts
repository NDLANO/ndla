/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import { defineNdlaConfig, ndlaJsdomTest, ndlaSentryPlugin } from "../vite.config.base.mts";

export default defineNdlaConfig(
  ({ command }) => ({
    test: ndlaJsdomTest(),
    plugins: [process.env.VITEST ? react() : reactRouter(), ndlaSentryPlugin("editorial-frontend")],
    server: {
      warmup: {
        ssrFiles: ["./src/entry.server.tsx"],
        clientFiles: ["./src/entry.client.tsx", "./src/root.tsx"],
      },
    },
    // React Router must be bundled to ensure that client and SSR use the same build, in order for the `RouterContextProvider` to work.
    // punycode is bundled in dev because Node can't import named exports from its CommonJS build.
    ssr: { noExternal: command === "build" ? true : ["@react-router/express", "punycode"] },
    environments: { ssr: { build: { rolldownOptions: { input: "./src/server.ts" } } } },
  }),
  { outputLayout: false },
);
