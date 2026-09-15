/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from "oxlint";

const template = `/**
 * Copyright (c) <%= YEAR %>-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

`;

/** Deep imports into `@ndla/*` internals, which bypass each package's public entrypoints. */
const ndlaInternals = [
  "@ndla/*/lib/**",
  "@ndla/*/lib",
  "@ndla/*/es/**",
  "@ndla/*/es",
  "@ndla/*/src/**",
  "@ndla/*/src",
  "@ndla/*/build/*",
];

const lodash = { name: "lodash", message: "Do not import lodash directly, use subpath imports instead." };
const arkUi = {
  name: "@ark-ui/react",
  message: "Do not import from @ark-ui/react directly, use subpath imports instead.",
};

export default defineConfig({
  // Naming `plugins` replaces the default set, so the default `unicorn` and `oxc` are repeated.
  plugins: ["eslint", "react", "import", "jsx-a11y", "typescript", "unicorn", "oxc"],
  jsPlugins: ["eslint-plugin-notice", { name: "import-js", specifier: "eslint-plugin-import" }],
  env: { builtin: true },
  options: { typeAware: true },
  // Everything in `correctness` is on by default; this only raises it from warn to error.
  categories: { correctness: "error" },
  rules: {
    "no-prototype-builtins": "error",
    "no-unexpected-multiline": "error",
    "no-case-declarations": "error",
    "no-empty": "error",
    "no-console": "warn",
    "array-callback-return": "warn",
    "default-case": "warn",
    eqeqeq: ["warn", "smart"],
    "no-self-compare": "warn",
    "no-template-curly-in-string": "warn",
    "no-throw-literal": "warn",
    "no-sequences": "warn",
    "no-use-before-define": ["warn", { functions: false, classes: false, variables: false, typedefs: false }],
    "no-duplicate-imports": "error",
    "no-unused-vars": [
      "error",
      {
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        args: "all",
        ignoreRestSiblings: true,
      },
    ],
    "no-restricted-imports": ["error", { paths: [lodash, arkUi], patterns: ndlaInternals }],
    "react/jsx-no-comment-textnodes": "error",
    "react/jsx-no-target-blank": "error",
    "react/no-unescaped-entities": "error",
    "react/no-unknown-property": "error",
    "react/require-render-return": "error",
    "react/button-has-type": "error",
    "react/jsx-pascal-case": "warn",
    "react/style-prop-object": "warn",
    "react/jsx-no-useless-fragment": "error",
    "react/rules-of-hooks": "error",
    // TODO: react/jsx-no-leaked-render has no oxlint equivalent yet.
    "import/first": "error",
    "import/no-anonymous-default-export": "error",
    // Its suggested tags do not fit <form role="search">, role="group" on a tag list, or
    // role="button" on a span inside contentEditable.
    "jsx-a11y/prefer-tag-over-role": "off",
    "typescript/ban-ts-comment": "error",
    "typescript/no-require-imports": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/no-import-type-side-effects": "error",
    "typescript/no-deprecated": "error",
    // Only fires on Formik's pre-bound FieldArray helpers and on mocked methods.
    "typescript/unbound-method": "off",
    // consider turning these on later
    "typescript/no-floating-promises": "off",
    "typescript/no-redundant-type-constituents": "off",
    "typescript/restrict-template-expressions": "off",
    "import-js/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/*.config.{js,mjs,cjs,ts,mts,cts}",
          "**/*.config.*.{js,mjs,cjs,ts,mts,cts}",
          "**/.*rc.{js,mjs,cjs,ts,mts,cts}",
          "**/codegen.ts",
          "**/scripts/**",
          "**/.storybook/**",
        ],
      },
    ],
    "notice/notice": ["error", { template }],
  },
  ignorePatterns: [
    "**/es/**/*",
    "**/lib/**/*",
    "**/dist/**/*",
    "**/build/**/*",
    "**/styled-system/**/*",
    "**/public/**/*",
    // generated
    "**/types-backend/src/**/*",
    "packages/images/**/*",
    "ndla-frontend/src/graphqlTypes.ts",
    "ndla-frontend/src/schema.graphql",
    "graphql-api/src/types/schema.d.ts",
    // vendored H5P snippet
    "editorial-frontend/src/components/DisplayEmbed/helpers/h5pResizer.ts",
    // recorded playwright fixtures
    "**/e2e/apiMocks/**/*",
    "**/e2e/fixtures/**/*",
  ],
  overrides: [
    {
      files: ["**/*-test.{ts,tsx}", "**/__tests__/**/*", "**/testUtils/**/*", "**/vitest.setup.ts"],
      rules: { "import-js/no-extraneous-dependencies": "off" },
    },
    {
      // TODO: drop once the direct @ark-ui/react imports are converted to subpaths
      files: ["ndla-frontend/**/*", "editorial-frontend/**/*"],
      rules: { "no-restricted-imports": ["error", { paths: [lodash], patterns: ndlaInternals }] },
    },
    {
      // Playwright fixtures shadow React's `use()`.
      files: ["**/e2e/**/*"],
      rules: { "react/rules-of-hooks": "off", "import-js/no-extraneous-dependencies": "off" },
    },
    {
      // imports `…?worker` virtual modules that the import plugin cannot resolve
      files: ["editorial-frontend/src/components/MonacoEditor/**/*"],
      rules: { "import/default": "off" },
    },
    {
      files: ["packages/**/*.stories.tsx"],
      rules: {
        "react/no-unescaped-entities": "off",
        "import-js/no-extraneous-dependencies": "off",
        "jsx-a11y/control-has-associated-label": "off",
      },
    },
  ],
});
