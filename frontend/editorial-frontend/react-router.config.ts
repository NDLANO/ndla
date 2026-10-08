/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  buildDirectory: "build",
  ssr: true,
  // Lets Vite find the dependencies of all routes on startup, instead of reloading the page when it finds them in dev
  future: { unstable_optimizeDeps: true },
} satisfies Config;
