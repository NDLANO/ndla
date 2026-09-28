/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, test } from "vitest";
import { parseNdlaUrl } from "../format/ndlaUrl";

test.each([
  ["https://ndla.no/article/123", { target: { kind: "article", id: 123 } }],
  ["https://ndla.no/nn/article/123", { language: "nn", target: { kind: "article", id: 123 } }],
  ["https://ndla.no/learningpaths/5", { target: { kind: "learningpath", id: 5 } }],
  ["https://ndla.no/learningpaths/5/steps/77", { target: { kind: "learningpath", id: 5, stepId: 77 } }],
  ["https://ndla.no/concept/9", { target: { kind: "concept", id: 9 } }],
  ["https://ndla.no/image/60147", { target: { kind: "image", id: 60147 } }],
  ["https://ndla.no/audio/2705", { target: { kind: "audio", id: 2705 } }],
  ["https://ndla.no/podkast/9", { target: { kind: "podcast-series", id: 9 } }],
  ["https://ndla.no/video/6250673288001", { target: { kind: "video", id: "6250673288001" } }],
  ["https://ndla.no/r/naturfag-sf/fotosyntese/ae19d59d02", { target: { kind: "context", contextId: "ae19d59d02" } }],
  [
    "https://ndla.no/r/naturfag-sf/sti/b9081fe0e9/15523",
    { target: { kind: "context", contextId: "b9081fe0e9", stepId: 15523 } },
  ],
  ["https://ndla.no/r/ae19d59d02", { target: { kind: "context", contextId: "ae19d59d02" } }],
  ["https://ndla.no/e/naturfag-sf/big-bang/a1ff8a3a77", { target: { kind: "context", contextId: "a1ff8a3a77" } }],
  ["https://ndla.no/f/naturfag-sf/13d1f84a7ef7", { target: { kind: "context", contextId: "13d1f84a7ef7" } }],
  [
    "https://ndla.no/utdanning/studiespesialisering/1ac2c3bf21/vg1",
    { target: { kind: "context", contextId: "1ac2c3bf21" } },
  ],
  ["https://test.ndla.no/en/article/1?foo=bar", { language: "en", target: { kind: "article", id: 1 } }],
  ["ndla.no/article/8", { target: { kind: "article", id: 8 } }],
  ["/article/8", { target: { kind: "article", id: 8 } }],
])("parses %s", (url, expected) => {
  expect(parseNdlaUrl(url)).toEqual({ language: undefined, ...expected });
});

test.each([
  "https://example.com/article/1",
  "https://evilndla.no/article/1",
  "https://ndla.no/",
  "https://ndla.no/minndla/folders",
  "https://ndla.no/article/abc",
  "https://ndla.no/r/naturfag-sf/not-a-context",
  "not a url at all ::::",
])("rejects %s", (url) => {
  expect(parseNdlaUrl(url)).toBeUndefined();
});
