/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Manifest } from "vite";
import { getRouteChunkInfo } from "../getManifestChunks";

const createManifest = (): Manifest => ({
  "src/client.tsx": {
    file: "static/client-abc.js",
    isEntry: true,
    css: ["static/entry.css"],
    imports: ["dep"],
  },
  dep: { file: "static/dep-def.js", css: ["static/dep.css"] },
  "src/style/index.css": { file: "static/global-xyz.css" },
});

test("collects the entry point, imported chunks and css", () => {
  const chunkInfo = getRouteChunkInfo(createManifest(), "default");
  expect(chunkInfo.entryPoint).toBe("static/client-abc.js");
  expect(chunkInfo.importedChunks).toEqual(["static/dep-def.js"]);
  expect(chunkInfo.css).toEqual(["static/entry.css", "static/global-xyz.css", "static/dep.css"]);
});

test("does not mutate the manifest", () => {
  const manifest = createManifest();
  const before = structuredClone(manifest);
  getRouteChunkInfo(manifest, "default");
  expect(manifest).toEqual(before);
});

test("returns the same chunk info when called repeatedly", () => {
  const manifest = createManifest();
  const first = getRouteChunkInfo(manifest, "default");
  getRouteChunkInfo(manifest, "default");
  const third = getRouteChunkInfo(manifest, "default");
  expect(third).toEqual(first);
});
