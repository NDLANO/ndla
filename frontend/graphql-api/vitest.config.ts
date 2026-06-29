/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRequire } from "module";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

export default defineConfig(() => {
  return {
    test: {
      include: ["src/**/__tests__/*-test.(js|ts)"],
      // environment: "jsdom",
      globals: true,
      alias: {
        // fixes Duplicate "graphql" modules cannot be used at the same time since different
        graphql: require.resolve("graphql"),
      },

      // setupFiles: "./vitest.setup.ts",
    },
  };
});
