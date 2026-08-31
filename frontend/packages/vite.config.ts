/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { ndlaClientConditions, ndlaJsdomTest } from "../vite.config.base.mts";

export default defineConfig({
  resolve: { conditions: ndlaClientConditions },
  plugins: [react()],
  test: ndlaJsdomTest({
    include: ["packages/**/src/**/__tests__/*-test.(js|jsx|ts|tsx)"],
    setupFiles: "./vitest.setup.ts",
    env: { NODE_ENV: "unittest" },
  }),
});
