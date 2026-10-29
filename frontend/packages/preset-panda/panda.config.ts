/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { defineConfig } from "@pandacss/dev";
import preset from "./src";
import { forwardCssPropPlugin } from "./src/plugins/forwardCssPropPlugin";

export default defineConfig({
  presets: [preset],
  preflight: false,
  jsxStyleProps: "minimal",
  strictPropertyValues: true,
  strictTokens: true,
  shorthands: false,
  outExtension: "js",
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: ["./src/**/*.stories.{js,jsx,ts,tsx}", "./src/**/*-test.{js,jsx,ts,tsx}"],
  importMap: "@ndla/styled-system",
  outdir: "../styled-system/src",
  jsxFramework: "react",
  plugins: [
    forwardCssPropPlugin(),
    {
      name: "styled-system-lib-types",
      hooks: {
        // We need to support both esm and cjs. This allows us to transpile the esm output to cjs. TODO: Remove this once we fully transition to esm.
        "codegen:done": ({ files, outdir }) => {
          for (const file of files) {
            if (!file.endsWith(".d.ts")) continue;
            const source = resolve(outdir, file);
            const target = join(outdir, "../lib", relative(outdir, source));
            mkdirSync(dirname(target), { recursive: true });
            copyFileSync(source, target);
          }
        },
      },
    },
  ],
});
