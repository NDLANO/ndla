/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRequire } from "module";
import { defaultClientConditions, defaultServerConditions } from "vite";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

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
      // onwarn(warning, warn) {
      //   if (warning.code === "EVAL") return;
      //   warn(warning);
      // },
    },
  },
  test: {
    include: ["src/**/__tests__/*-test.(js|ts)"],
    // environment: "jsdom",
    globals: true,
    alias: {
      // fixes Duplicate "graphql" modules cannot be used at the same time since different
      graphql: require.resolve("graphql"),
    },
  },
}));
