/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type ConfigEnv,
  defaultClientConditions,
  defaultServerConditions,
  defineConfig,
  mergeConfig,
  type UserConfig,
  type UserConfigFnObject,
} from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { ViteUserConfig } from "vitest/config";

export const ndlaClientConditions: string[] = ["ndla-source", ...defaultClientConditions];
export const ndlaServerConditions: string[] = ["ndla-source", ...defaultServerConditions];

const ndlaConfig = ({ command }: ConfigEnv): UserConfig => ({
  resolve: { conditions: ndlaClientConditions },
  ssr: {
    noExternal: command === "build" ? true : undefined,
    external: ["vite"],
    resolve: { conditions: ndlaServerConditions },
  },
  environments: {
    client: {
      build: {
        target: "baseline-widely-available",
        outDir: "build/public",
        assetsDir: "static",
        sourcemap: true,
        emptyOutDir: true,
        copyPublicDir: true,
        manifest: true,
      },
    },
    ssr: {
      build: {
        target: "node24",
        outDir: "build",
        sourcemap: true,
        emptyOutDir: false,
        copyPublicDir: false,
        rolldownOptions: {
          output: { format: "es", entryFileNames: "[name].mjs", codeSplitting: false },
        },
      },
    },
  },
});

type TestOptions = NonNullable<ViteUserConfig["test"]>;

export const ndlaJsdomTest = (overrides?: TestOptions): TestOptions => ({
  include: ["src/**/__tests__/**/*-test.(js|jsx|ts|tsx)"],
  environment: "jsdom",
  globals: true,
  setupFiles: "./src/__tests__/vitest.setup.ts",
  ...overrides,
});

export const ndlaNodeTest = (overrides?: TestOptions): TestOptions => ({
  include: ["src/**/__tests__/**/*-test.(js|ts)"],
  environment: "node",
  globals: true,
  ...overrides,
});

export const defineNdlaConfig = (
  overrides?: UserConfig | ((env: ConfigEnv) => UserConfig),
): UserConfigFnObject => {
  return defineConfig((env) => {
    const overrideConfig = typeof overrides === "function" ? overrides(env) : (overrides ?? {});
    return mergeConfig(ndlaConfig(env), overrideConfig);
  });
};

export const ndlaSentryPlugin = (componentName: string) => {
  const componentVersion = process.env.COMPONENT_VERSION ?? "SNAPSHOT";
  return sentryVitePlugin({
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG ?? "ndlano",
    project: process.env.SENTRY_PROJECT ?? componentName,
    release: {
      name: `${componentName}@${componentVersion}`,
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
  });
};
