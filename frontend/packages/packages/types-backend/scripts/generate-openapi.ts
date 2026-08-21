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
 * Generates a typed SDK from an OpenAPI specification. Both paths are supplied by the caller
 * (see `backend/modules/openapi/package.mill`) so that Mill can generate into its own sandbox
 * rather than writing straight into the source tree. `outputPath` is a directory; Hey API
 * writes `types.gen.ts`, `sdk.gen.ts`, `client.gen.ts` and the bundled client into it.
 */
async function generateTypes(inputPath: string, outputPath: string) {
  console.log(`Parsing ${inputPath} to generate typescript files...`);

  await createClient({
    input: inputPath,
    output: { path: outputPath },
    plugins: [
      // `baseUrl: false` keeps the generated client from adopting the spec's `servers` entry;
      // taxonomy-api advertises `http://localhost:0`, and every app sets its own base url.
      { name: "@hey-api/client-fetch", baseUrl: false, includeInEntry: true },
      // `preserve` keeps schema names byte-identical (`OEmbedDTO`, not `OEmbedDto`), which is
      // what the ~800 type imports across the workspace are written against.
      { name: "@hey-api/typescript", definitions: { case: "preserve" } },
      "@hey-api/sdk",
    ],
  });

  console.log(`Outputting to ${outputPath}`);
}

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  throw new Error("Usage: generate-openapi <input-openapi-json> <output-directory>");
}

generateTypes(path.resolve(inputArg), path.resolve(outputArg)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
