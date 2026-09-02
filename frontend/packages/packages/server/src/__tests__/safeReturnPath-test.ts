/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from "vitest";
import { safeReturnPath } from "../safeReturnPath";

describe("safeReturnPath", () => {
  it("keeps a path with query and hash", () => {
    expect(safeReturnPath("/swagger?url=https://api.test.ndla.no/myndla-api/api-docs#tag")).toBe(
      "/swagger?url=https://api.test.ndla.no/myndla-api/api-docs#tag",
    );
  });

  it("leaves percent-encoding to the caller", () => {
    expect(safeReturnPath("/search?query=100%25")).toBe("/search?query=100%25");
    expect(safeReturnPath(encodeURIComponent("//evil.example.com"))).toBe("/%2F%2Fevil.example.com");
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["absolute url on another host", "https://evil.example.com/steal"],
    ["protocol-relative url", "//evil.example.com/steal"],
    ["backslash-relative url", "/\\evil.example.com/steal"],
    ["dot-segment protocol-relative url", "/.//evil.example.com/steal"],
    ["parent-segment protocol-relative url", "/minndla/..//evil.example.com"],
    ["url on another scheme", "javascript:alert(1)"],
  ])("rejects %s", (_name, input) => {
    expect(safeReturnPath(input)).toBeUndefined();
  });
});
