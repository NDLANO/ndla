/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console -- this is a CLI generator; the log output ends up in Mill's task log. */

import fs from "node:fs";
import path from "node:path";
import openapiTS, { astToString } from "openapi-typescript";
import ts, { type TypeNode } from "typescript";

const BLOB = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Blob"));
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

/**
 * Generates typescript types from an OpenAPI specification. Both paths are supplied by the caller
 * (see `backend/modules/OpenAPITSPlugin.mill`) so that Mill can generate into its own sandbox
 * rather than writing straight into the source tree.
 */
async function generateTypes(inputPath: string, outputPath: string) {
  console.log(`Parsing ${inputPath} to generate typescript files...`);
  const schema = await fs.promises.readFile(inputPath, "utf8");
  const schemaContent = JSON.parse(schema);

  const ast = await openapiTS(schemaContent, {
    exportType: true,
    rootTypes: true,
    rootTypesKeepCasing: true,
    rootTypesNoSchemaPrefix: true,
    // https://openapi-ts.dev/migration-guide#defaultnonnullable-true-by-default
    defaultNonNullable: false,
    transform(schemaObject, _options): TypeNode | undefined {
      if (schemaObject.format === "binary") {
        return schemaObject.nullable ? ts.factory.createUnionTypeNode([BLOB, NULL]) : BLOB;
      }
      return undefined;
    },
  });

  const output = astToString(ast);

  console.log(`Outputting to ${outputPath}`);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, output);
}

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  throw new Error("Usage: generate-openapi <input-openapi-json> <output-typescript-file>");
}

generateTypes(path.resolve(inputArg), path.resolve(outputArg)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
