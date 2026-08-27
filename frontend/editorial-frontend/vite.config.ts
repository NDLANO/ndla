/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from "@vitejs/plugin-react";
import { defineNdlaConfig, ndlaJsdomTest, ndlaSentryPlugin } from "../vite.config.base.mts";

export default defineNdlaConfig({
  test: ndlaJsdomTest(),
  plugins: [react(), ndlaSentryPlugin("editorial-frontend")],
  server: { warmup: { clientFiles: ["./src/client.tsx"] } },
  environments: { client: { build: { manifest: false } } },
});
