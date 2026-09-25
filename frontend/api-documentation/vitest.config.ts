/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from "vite";
import { defineNdlaConfig, ndlaNodeTest, ndlaServerConditions } from "../vite.config.base.mts";

/** `@opentelemetry/api`s "module" entry is bundler-only ESM, which node cannot import. Fall back to CJS. */
const nodeConditions = ndlaServerConditions.filter((condition) => condition !== "module");

// Spread rather than merged: `mergeConfig` concatenates arrays, so it cannot drop a condition.
export default defineConfig((env) => {
  const config = defineNdlaConfig({ test: ndlaNodeTest() })(env);

  return { ...config, ssr: { ...config.ssr, resolve: { ...config.ssr?.resolve, conditions: nodeConditions } } };
});
