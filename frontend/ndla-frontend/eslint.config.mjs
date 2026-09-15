/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @ts-check

import graphqlPlugin from "@graphql-eslint/eslint-plugin";
import tseslint from "typescript-eslint";

// GraphQL is the only thing linted here; everything else lives in oxlint.config.ts.
const config = [
  {
    ignores: ["**/graphqlTypes.ts", "**/schema.graphql"],
  },
  {
    // The processor hands the host file's own source back as its last block, so TS files need a
    // TS parser even though no JS/TS rules are enabled here.
    files: ["**/*.{ts,tsx,mts,cts,mtsx,ctsx}"],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx,mts,cts,mtsx,ctsx}"],
    processor: graphqlPlugin.processor,
  },
  {
    files: ["**/*.graphql"],
    languageOptions: {
      parser: graphqlPlugin.parser,
      parserOptions: {
        graphQLConfig: {
          schema: "./src/schema.graphql",
          documents: ["./src/**/*.{ts,tsx}"],
        },
      },
    },
    plugins: { "@graphql-eslint": graphqlPlugin },
    rules: {
      ...graphqlPlugin.configs["flat/operations-recommended"].rules,
      ...graphqlPlugin.configs["flat/schema-recommended"].rules,
      "@graphql-eslint/selection-set-depth": "off",
      "@graphql-eslint/require-selections": "off",
    },
  },
];

export default config;
