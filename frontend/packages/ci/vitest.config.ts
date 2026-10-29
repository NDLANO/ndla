/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from "vitest/config";
import { ndlaNodeTest } from "../../vite.config.base.mts";

export default defineConfig({
  test: ndlaNodeTest({ include: ["src/**/__tests__/*-test.mts"], testTimeout: 60_000 }),
});
