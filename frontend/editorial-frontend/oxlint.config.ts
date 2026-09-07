/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from "oxlint";
import baseConfig, {
  lodashImportPath,
  playwrightOverride,
  restrictedImports,
  sharedIgnorePatterns,
} from "../packages/packages/oxlint-config/src/index.ts";

export default defineConfig({
  extends: [baseConfig],
  options: {
    typeAware: true,
  },
  ignorePatterns: [
    ...sharedIgnorePatterns,
    // vendored H5P snippet
    "src/components/DisplayEmbed/helpers/h5pResizer.ts",
    // recorded playwright fixtures
    "e2e/apiMocks/**/*",
    "public/**/*",
  ],
  rules: {
    // TODO: drop this override once the direct @ark-ui/react imports are converted to subpaths
    "no-restricted-imports": restrictedImports(lodashImportPath),
  },
  overrides: [
    playwrightOverride,
    {
      files: ["src/components/MonacoEditor/**/*"],
      rules: {
        // imports `…?worker` virtual modules that the import plugin cannot resolve
        "import/default": "off",
      },
    },
  ],
});
