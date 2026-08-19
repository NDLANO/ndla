/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defaultClientConditions, defaultServerConditions, defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  ssr: {
    noExternal: command === "build" ? true : undefined,
    resolve: {
      conditions: command === "serve" ? ["ndla-source", ...defaultServerConditions] : undefined,
    },
  },
  resolve: {
    conditions: command === "serve" ? ["ndla-source", ...defaultClientConditions] : undefined,
  },
  build: {
    ssr: "src/server.ts",
    outDir: "build",
    sourcemap: true,
    target: "node24",
    rolldownOptions: {
      output: { format: "es", entryFileNames: "[name].mjs", codeSplitting: false },
    },
  },
}));
