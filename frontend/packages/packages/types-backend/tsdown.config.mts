/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import shared from "../../tsdown.config.mts";

/**
 * One entry per generated API module, plus each module's bundled client barrel — apps import
 * `createClient`/`createConfig` from there to build extra client instances. The shared config
 * only builds `src/index.ts`.
 */
const config = { ...shared, entry: ["src/*/index.ts", "src/*/client/index.ts"] };

export default config;
