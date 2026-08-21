/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from "@vitejs/plugin-react";
import { defaultClientConditions, defaultServerConditions, defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*-test.(js|jsx|ts|tsx)"],
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/__tests__/vitest.setup.ts",
  },
  plugins: [react()],
  server: {
    warmup: {
      clientFiles: ["./src/client.tsx"],
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-helmet-async", "i18next", "react-i18next"],
    conditions: ["ndla-source", ...defaultClientConditions],
  },
  ssr: {
    resolve: {
      conditions: ["ndla-source", ...defaultServerConditions],
    },
  },
  build: {
    target: "baseline-widely-available",
    assetsDir: "static",
    outDir: "build/public",
    sourcemap: true,
  },
});
