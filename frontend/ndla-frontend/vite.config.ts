/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defaultServerConditions, defineConfig } from "vite";
import { gqlPlugin } from "vite-plugin-graphql-tag";
import { entryPoints } from "./src/entrypoints.ts";

export default defineConfig(({ command }) => {
  const componentVersion = process.env.COMPONENT_VERSION ?? "SNAPSHOT";
  return {
    test: {
      include: ["src/**/__tests__/**/*-test.(js|jsx|ts|tsx)"],
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/__tests__/vitest.setup.ts",
    },
    plugins: [
      gqlPlugin({ strip: true }),
      react(),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG ?? "ndlano",
        project: process.env.SENTRY_PROJECT ?? "ndla-frontend",
        release: {
          name: `ndla-frontend@${componentVersion}`,
        },
        url: "https://sentry.io/",
        telemetry: false,
        bundleSizeOptimizations: {
          excludeDebugStatements: true,
          excludeReplayIframe: true,
          excludeReplayShadowDom: true,
          excludeReplayWorker: true,
          excludeTracing: true,
        },
      }),
    ],
    server: {
      warmup: {
        ssrFiles: ["./src/server/server.render.ts"],
        clientFiles: [entryPoints.default],
      },
    },
    resolve: {
      conditions: ["ndla-source", ...defaultClientConditions],
    },
    ssr: {
      noExternal: command === "build" ? true : ["@apollo/client"],
      external: ["vite"],
      resolve: {
        conditions: ["ndla-source", ...defaultServerConditions],
      },
    },
    input: entryPoints,
    build: {
      target: "baseline-widely-available",
      assetsDir: "static",
      outDir: "build/public",
      emptyOutDir: true,
      copyPublicDir: true,
      cssCodeSplit: false,
      manifest: true,
      sourcemap: true,
    },
    define: {
      __IS_SSR_BUILD__: false,
    },
    environments: {
      ssr: {
        build: {
          target: "node24",
          outDir: "build",
          emptyOutDir: false,
          copyPublicDir: false,
          manifest: false,
          rolldownOptions: { output: { format: "es", codeSplitting: false } },
        },
        define: {
          __IS_SSR_BUILD__: true,
        },
      },
    },
  };
});
