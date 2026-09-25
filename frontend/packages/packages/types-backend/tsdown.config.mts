/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from "tsdown";
import baseConfig from "../../tsdown.config.mts";

export default defineConfig({ ...baseConfig, entry: ["src/*.ts"] });
