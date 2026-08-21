/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from "@vitejs/plugin-react";
import { defaultClientConditions, defaultServerConditions, defineConfig } from "vite";

export default defineConfig(() => {
  return {
    test: {
      include: ["packages/**/src/**/__tests__/*-test.(js|jsx|ts|tsx)"],
      environment: "jsdom",
      globals: true,
      setupFiles: "./vitest.setup.ts",
      env: { NODE_ENV: "unittest" },
    },
    plugins: [react()],
    resolve: {
      conditions: ["ndla-source", ...defaultClientConditions],
    },
    ssr: {
      resolve: {
        // `@opentelemetry/api`s "module" entry is bundler-only ESM, which node cannot import. Fall back to CJS.
        conditions: ["ndla-source", ...defaultServerConditions.filter((condition) => condition !== "module")],
      },
    },
  };
});
