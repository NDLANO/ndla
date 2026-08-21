/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { build } from "rolldown";

await build({
  input: "src/index.ts",
  platform: "node",
  external: ["vite"],
  resolve: {
    // Mirror the conditions in Vite config
    conditionNames: ["ndla-source", "node", "production", "default"],
  },
  output: {
    file: "build/server.mjs",
    format: "esm",
    codeSplitting: false,
    sourcemap: true,
  },
});
