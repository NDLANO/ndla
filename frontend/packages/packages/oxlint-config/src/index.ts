/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fileURLToPath } from "node:url";
import { type AllowWarnDeny, defineConfig, type OxlintOverride } from "oxlint";

// oxlint resolves bare `jsPlugins` specifiers from inside the oxlint package rather than from
// this file, which only works while pnpm happens to hoist them. Resolve them here, where they
// are actual dependencies. `import.meta.resolve` does not survive the CJS build, so consumers
// of `lib/` fall back to the bare specifier and to oxlint's own resolution.
const resolvePlugin = (specifier: string): string => {
  try {
    return fileURLToPath(import.meta.resolve(specifier));
  } catch {
    return specifier;
  }
};

const template = `/**
 * Copyright (c) ${new Date().getFullYear()}-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

`;

const mustMatch =
  "^/\\*\\*\\n" +
  " \\* Copyright \\(c\\) [0-9]{0,4}-present, NDLA\\.\\n" +
  " \\*\\n" +
  " \\* This source code is licensed under the GPLv3 license found in the\\n" +
  " \\* LICENSE file in the root directory of this source tree\\.\\n" +
  " \\*\\n" +
  " \\*/";

/** Build output and generated sources that no project should ever lint. */
export const sharedIgnorePatterns = [
  "**/es/**/*",
  "**/lib/**/*",
  "**/dist/**/*",
  "**/build/**/*",
  "**/styled-system/**/*",
];

/** Deep imports into `@ndla/*` internals, which bypass each package's public entrypoints. */
export const ndlaInternalImportPatterns = [
  "@ndla/*/lib/**",
  "@ndla/*/lib",
  "@ndla/*/es/**",
  "@ndla/*/es",
  "@ndla/*/src/**",
  "@ndla/*/src",
  "@ndla/*/build/*",
];

export const lodashImportPath = {
  name: "lodash",
  message: "Do not import lodash directly, use subpath imports instead.",
};

export const arkUiImportPath = {
  name: "@ark-ui/react",
  message: "Do not import from @ark-ui/react directly, use subpath imports instead.",
};

interface RestrictedImportPath {
  name: string;
  message: string;
}

/** `no-restricted-imports` banning `paths` on top of the always-banned `@ndla/*` internals. */
export const restrictedImports = (
  ...paths: RestrictedImportPath[]
): [AllowWarnDeny, { paths: RestrictedImportPath[]; patterns: string[] }] => [
  "error",
  { paths, patterns: ndlaInternalImportPatterns },
];

/** Test files may reach for `devDependencies`, which never ship. */
export const testFileOverride: OxlintOverride = {
  files: ["**/*-test.{js,mjs,cjs,ts,jsx,tsx,mts,cts,mtsx,ctsx}", "**/__tests__/**/*"],
  rules: {
    "import-js/no-extraneous-dependencies": "off",
  },
};

/** Playwright suites, which are dev-only and shadow React's `use()` with their own fixtures. */
export const playwrightOverride: OxlintOverride = {
  files: ["e2e/**/*"],
  rules: {
    "react/rules-of-hooks": "off",
    "import-js/no-extraneous-dependencies": "off",
  },
};

export const baseConfig = defineConfig({
  plugins: ["eslint", "react", "import", "jsx-a11y", "typescript"],
  jsPlugins: [
    {
      name: "notice",
      specifier: resolvePlugin("eslint-plugin-notice"),
    },
    {
      name: "import-js",
      specifier: resolvePlugin("eslint-plugin-import"),
    },
  ],
  env: {
    builtin: true,
  },
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
    "no-unused-expressions": "error",
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
    "no-restricted-imports": restrictedImports(lodashImportPath, arkUiImportPath),
    "react/jsx-key": "error",
    "react/jsx-no-comment-textnodes": "error",
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-target-blank": "error",
    "react/jsx-no-undef": "error",
    "react/no-children-prop": "error",
    "react/no-danger-with-children": "error",
    "react/no-direct-mutation-state": "error",
    "react/no-find-dom-node": "error",
    "react/no-is-mounted": "error",
    "react/no-render-return-value": "error",
    "react/no-string-refs": "error",
    "react/no-unescaped-entities": "error",
    "react/no-unknown-property": "error",
    "react/require-render-return": "error",
    "react/button-has-type": "error",
    "react/jsx-pascal-case": "warn",
    "react/style-prop-object": "warn",
    "react/forward-ref-uses-ref": "error",
    "react/jsx-no-useless-fragment": "error",
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "error",
    // TODO: react/jsx-no-leaked-render has no oxlint equivalent yet.
    "import/no-cycle": "off",
    "import/first": "error",
    "import/no-anonymous-default-export": "error",
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/anchor-is-valid": "error",
    "jsx-a11y/aria-activedescendant-has-tabindex": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-role": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/heading-has-content": "error",
    "jsx-a11y/html-has-lang": "error",
    "jsx-a11y/iframe-has-title": "error",
    "jsx-a11y/img-redundant-alt": "error",
    "jsx-a11y/label-has-associated-control": "error",
    "jsx-a11y/media-has-caption": "error",
    "jsx-a11y/mouse-events-have-key-events": "error",
    "jsx-a11y/no-access-key": "error",
    "jsx-a11y/no-autofocus": "error",
    "jsx-a11y/no-distracting-elements": "error",
    "jsx-a11y/no-redundant-roles": "error",
    "jsx-a11y/no-noninteractive-tabindex": "error",
    // On by default, but its suggested tags do not fit our uses: <form role="search">,
    // role="group" on a tag list, and role="button" on a span inside contentEditable.
    // TODO: reconsider once the icon-only role="button" call sites become real buttons.
    "jsx-a11y/prefer-tag-over-role": "off",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "jsx-a11y/scope": "error",
    "jsx-a11y/tabindex-no-positive": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/interactive-supports-focus": "error",
    "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
    "jsx-a11y/no-noninteractive-element-interactions": "error",
    "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
    "typescript/ban-ts-comment": "error",
    "typescript/no-require-imports": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/no-import-type-side-effects": "error",
    // On by default, but only fires on Formik's pre-bound FieldArray helpers and on
    // assertions against mocked methods, neither of which is a `this` hazard.
    "typescript/unbound-method": "off",
    // consider turning these on later
    "typescript/no-floating-promises": "off",
    "typescript/no-redundant-type-constituents": "off",
    "typescript/restrict-template-expressions": "off",
    // these are slow
    "typescript/no-deprecated": "error",
    // these are slow and enabled by default
    // "typescript/no-base-to-string": "off",
    // "typescript/no-duplicate-type-constituents": "off",
    // "typescript/no-misused-spread": "off",
    // "typescript/no-useless-default-assignment": "off",

    // js plugins - these are also slow
    "import-js/no-extraneous-dependencies": "error",
    "notice/notice": [
      "error",
      {
        mustMatch: mustMatch,
        template: template,
      },
    ],
  },
  overrides: [testFileOverride],
});

export default baseConfig;
