/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineNdlaConfig, ndlaNodeTest } from "../vite.config.base.mts";
import { CLIENT_ENTRY } from "./src/clientEntry.ts";

export default defineNdlaConfig({
  test: ndlaNodeTest(),
  input: { client: CLIENT_ENTRY },
});
