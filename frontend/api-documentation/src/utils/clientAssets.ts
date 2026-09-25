/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Manifest } from "vite";
import { CLIENT_ENTRY } from "../clientEntry.js";

export interface ClientAssets {
  scripts: string[];
  styles: string[];
}

/** Read from disk rather than inlined at build time, so the server build need not run after the client one. */
const readProductionAssets = (): ClientAssets => {
  const manifestPath = path.join(import.meta.dirname, "public", ".vite", "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Manifest;
  const entry = manifest[CLIENT_ENTRY];
  if (!entry) {
    throw new Error(`Vite manifest ${manifestPath} has no "${CLIENT_ENTRY}" entry. Did the client build run?`);
  }
  return { scripts: [`/${entry.file}`], styles: (entry.css ?? []).map((file) => `/${file}`) };
};

export const clientAssets: ClientAssets = (() => {
  if (!import.meta.env.PROD) return { scripts: ["/@vite/client", `/${CLIENT_ENTRY}`], styles: [] };
  return readProductionAssets();
})();
