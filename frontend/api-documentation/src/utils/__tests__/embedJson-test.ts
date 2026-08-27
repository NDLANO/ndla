/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { embedJson } from "../embedJson.js";

it("embedJson escapes anything that could break out of a script tag", () => {
  const clientId = "</script><script>alert(1)</script>";
  const embedded = embedJson({ personalClientId: clientId });

  expect(embedded).not.toContain("<");
  expect(JSON.parse(embedded)).toEqual({ personalClientId: clientId });
});

it("embedJson escapes the javascript line terminators that are legal inside json", () => {
  const clientId = "a\u2028b\u2029c";
  const embedded = embedJson({ personalClientId: clientId });

  expect(embedded).not.toContain("\u2028");
  expect(embedded).not.toContain("\u2029");
  expect(JSON.parse(embedded)).toEqual({ personalClientId: clientId });
});
