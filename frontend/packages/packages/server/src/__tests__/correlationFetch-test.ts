/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installCorrelationIdFetch } from "../correlationFetch";
import { withLoggerContext } from "../loggerContextMiddleware";

describe("installCorrelationIdFetch", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    installCorrelationIdFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("adds the correlation id of the current request", async () => {
    fetchMock.mockResolvedValue(new Response("ok"));

    await withLoggerContext({ correlationID: "correlation-id", requestPath: "/" }, () =>
      fetch("http://localhost/api", { headers: { accept: "application/json" } }),
    );

    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.headers.get("x-correlation-id")).toBe("correlation-id");
    expect(request.headers.get("accept")).toBe("application/json");
  });

  it("leaves requests outside a request context alone", async () => {
    fetchMock.mockResolvedValue(new Response("ok"));

    await fetch("http://localhost/api");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost/api", undefined);
  });

  it("annotates failed requests with their target", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(fetch("http://localhost/api", { method: "POST" })).rejects.toMatchObject({
      message: "fetch failed",
      requestUrl: "http://localhost/api",
      requestMethod: "POST",
    });
  });
});
