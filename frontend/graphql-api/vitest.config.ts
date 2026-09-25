/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRequire } from "node:module";
import { defineConfig } from "vite";
import { defineNdlaConfig, ndlaNodeTest, ndlaServerConditions } from "../vite.config.base.mts";

const require = createRequire(import.meta.url);

/** `@opentelemetry/api`s "module" entry is bundler-only ESM, which node cannot import. Fall back to CJS. */
const nodeConditions = ndlaServerConditions.filter((condition) => condition !== "module");

// Spread rather than merged: `mergeConfig` concatenates arrays, so it cannot drop a condition.
export default defineConfig((env) => {
  const config = defineNdlaConfig({
    // fixes Duplicate "graphql" modules cannot be used at the same time since different
    test: ndlaNodeTest({ alias: { graphql: require.resolve("graphql") } }),
  })(env);

  return { ...config, ssr: { ...config.ssr, resolve: { ...config.ssr?.resolve, conditions: nodeConditions } } };
});
