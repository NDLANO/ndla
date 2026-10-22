/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { ndlaClientConditions } from "../vite.config.base.mts";

export default defineConfig({
  resolve: { conditions: ndlaClientConditions },
  plugins: [react()],
});
