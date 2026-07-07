/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This is just an entrypoint for vercel.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

// On Vercel the app is bundled under a workspace-relative subdirectory
process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

const { default: backend } = await import("../build/server.mjs");

const app = express();

app.use(backend);

export default app;
