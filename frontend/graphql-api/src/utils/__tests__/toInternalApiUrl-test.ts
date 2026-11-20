/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, test, vi } from "vitest";
import { toInternalApiUrl } from "../apiHelpers";

vi.mock("../../config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../config")>()),
  apiUrl: "http://api-gateway.internal",
  environmentApiHost: "api.ndla.no",
}));

describe("toInternalApiUrl", () => {
  test("rewrites the public api host to the internal gateway", () => {
    expect(toInternalApiUrl("https://api.ndla.no/files/resources/abc.pdf")).toBe(
      "http://api-gateway.internal/files/resources/abc.pdf",
    );
  });

  test("keeps the query string", () => {
    expect(toInternalApiUrl("https://api.ndla.no/taxonomy/v1/nodes?contextId=abc&language=nb")).toBe(
      "http://api-gateway.internal/taxonomy/v1/nodes?contextId=abc&language=nb",
    );
  });

  test("leaves other hosts unchanged", () => {
    expect(toInternalApiUrl("https://api.test.ndla.no/files/abc.pdf")).toBe("https://api.test.ndla.no/files/abc.pdf");
    expect(toInternalApiUrl("https://example.com/files/abc.pdf")).toBe("https://example.com/files/abc.pdf");
  });

  test("leaves relative and invalid urls unchanged", () => {
    expect(toInternalApiUrl("/files/abc.pdf")).toBe("/files/abc.pdf");
    expect(toInternalApiUrl("not a url")).toBe("not a url");
  });
});
