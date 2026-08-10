/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRequire } from "module";
import { defaultServerConditions } from "vite";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

const require = createRequire(import.meta.url);

export default defineConfig((env) => {
  const config = mergeConfig(viteConfig(env), {
    test: {
      include: ["src/**/__tests__/*-test.(js|ts)"],
      globals: true,
      alias: {
        // fixes Duplicate "graphql" modules cannot be used at the same time since different
        graphql: require.resolve("graphql"),
      },
    },
  });

  return {
    ...config,
    ssr: {
      ...config.ssr,
      resolve: {
        // `@opentelemetry/api`s "module" entry is bundler-only ESM, which node cannot import. Fall back to CJS.
        ...config.ssr?.resolve,
        conditions: (config.ssr?.resolve?.conditions ?? defaultServerConditions).filter(
          (condition: string) => condition !== "module",
        ),
      },
    },
  };
});
