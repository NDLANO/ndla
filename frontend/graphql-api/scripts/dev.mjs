/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Entry point for the `dev` script, which restarts the whole process on change rather than using
 * `vite-node --watch`: vite-node re-executes the entry in the same process, and the second run dies
 * on `prom-client`s process-global registry ("a metric with the name ... has already been
 * registered"), leaving the previous server up and serving stale code.
 *
 * `node --watch` needs a path it can execute, and pnpm's `node_modules/.bin/vite-node` is a shell
 * shim, so this file exists to reach vite-node through its public export instead of a path into its
 * `dist/`. The file to run is taken from argv, so `node --watch scripts/dev.mjs src/server.ts`.
 */
import "vite-node/cli";
