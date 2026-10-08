/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console -- this is a CLI generator; the log output ends up in Mill's task log. */

import path from "node:path";
import { createClient } from "@hey-api/openapi-ts";

/**
 * Generates typescript types and an SDK from an OpenAPI specification. Both paths are supplied by the caller
 * (see `backend/modules/OpenAPITSPlugin.mill`) so that Mill can generate into its own sandbox
 * rather than writing straight into the source tree.
 */
async function generateClient(inputPath: string, outputPath: string) {
  console.log(`Generating typescript client from ${inputPath} into ${outputPath}...`);

  await createClient({
    input: inputPath,
    output: { path: outputPath, clean: true },
    logs: { file: false },
    plugins: [
      { name: "@hey-api/typescript", definitions: { case: "preserve" }, enums: "javascript" },
      { name: "@hey-api/sdk", auth: false },
      { name: "@hey-api/client-fetch", baseUrl: false },
    ],
  });
}

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  throw new Error("Usage: generate-openapi <input-openapi-json> <output-directory>");
}

generateClient(path.resolve(inputArg), path.resolve(outputArg)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
