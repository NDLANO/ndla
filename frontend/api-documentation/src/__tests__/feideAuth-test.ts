/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { safeReturnPath } from "@ndla/server";

describe("returnTo fallback", () => {
  const returnTo = (raw: string | undefined) => safeReturnPath(raw) ?? "/swagger";

  it("keeps a safe path", () => {
    expect(returnTo("/swagger?url=https://api.test.ndla.no/myndla-api/api-docs")).toBe(
      "/swagger?url=https://api.test.ndla.no/myndla-api/api-docs",
    );
  });

  it("falls back to /swagger when missing", () => {
    expect(returnTo(undefined)).toBe("/swagger");
  });

  it("falls back to /swagger for an off-site url", () => {
    expect(returnTo("https://evil.example.com/steal")).toBe("/swagger");
    expect(returnTo("/.//evil.example.com/steal")).toBe("/swagger");
  });
});
