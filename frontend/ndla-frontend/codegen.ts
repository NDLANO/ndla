/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "../graphql-api/src/schema.ts",
  documents: "./src/**/!(*.d).{ts,tsx}",
  generates: {
    "src/graphqlTypes.ts": {
      plugins: ["typescript-operations"],
      config: {
        typesPrefix: "GQL",
        // Apollo recommends these
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
      },
    },
  },
};

export default config;
