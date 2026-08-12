/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outDir: "dist",
  outputOptions: (options, format) => {
    if (format === "es") {
      return {
        ...options,
        dir: "es",
        entryFileNames: "[name].mjs",
      };
    } else {
      return {
        ...options,
        dir: "lib",
        entryFileNames: "[name].js",
      };
    }
  },
  dts: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  target: "es2022",
  unbundle: true,
  inputOptions: (options) => ({
    ...options,
    watch: { buildDelay: 500 },
  }),
});
