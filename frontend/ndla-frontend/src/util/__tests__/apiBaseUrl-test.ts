/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, test, vi } from "vitest";
import type { ConfigType } from "../../config";

const loadApiBaseUrl = async (overrides: Partial<ConfigType>) => {
  vi.resetModules();
  vi.doMock("../../config", async (importOriginal) => {
    const original = await importOriginal<typeof import("../../config")>();
    return {
      default: {
        ...original.default,
        runtimeType: "production",
        ndlaApiUrl: "https://api.ndla.no",
        apiGatewayHost: "api-gateway.internal",
        ...overrides,
      },
    };
  });
  return (await import("../apiHelpers")).apiBaseUrl;
};

afterEach(() => {
  vi.doUnmock("../../config");
});

describe("apiBaseUrl", () => {
  test("uses the internal gateway on the server", async () => {
    expect(await loadApiBaseUrl({ isClient: false })).toBe("http://api-gateway.internal");
  });

  test("uses the public api in the browser", async () => {
    expect(await loadApiBaseUrl({ isClient: true })).toBe("https://api.ndla.no");
  });

  test("uses the public api on the server when no gateway host is set", async () => {
    expect(await loadApiBaseUrl({ isClient: false, apiGatewayHost: undefined })).toBe("https://api.ndla.no");
  });
});
