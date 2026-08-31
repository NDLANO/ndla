/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from "@vitejs/plugin-react";
import { gqlPlugin } from "vite-plugin-graphql-tag";
import { defineNdlaConfig, ndlaJsdomTest, ndlaSentryPlugin } from "../vite.config.base.mts";
import { entryPoints } from "./src/entrypoints.ts";

export default defineNdlaConfig(({ command }) => ({
  test: ndlaJsdomTest(),
  plugins: [gqlPlugin({ strip: true }), react(), ndlaSentryPlugin("ndla-frontend")],
  server: {
    warmup: {
      ssrFiles: ["./src/server/server.render.ts"],
      clientFiles: [entryPoints.default],
    },
  },
  // Apollo needs bundling in dev too, where everything else is left external.
  ssr: { noExternal: command === "build" ? true : ["@apollo/client"] },
  input: entryPoints,
  environments: { client: { build: { cssCodeSplit: false } } },
}));
