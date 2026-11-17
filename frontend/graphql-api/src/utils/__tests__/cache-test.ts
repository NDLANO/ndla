/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MiddlewareCallbackParams } from "openapi-fetch";
import { describe, expect, it } from "vitest";
import { getCache, getCacheKey, hasNoCacheDirective } from "../../cache";
import { withCustomContext } from "../context/contextStore";
import { OATSCacheMiddleware } from "../openapi-fetch/cacheMiddleware";

describe("Cache", () => {
  it("should include version hash in cache key when provided in taxonomy calls", () => {
    const url = "https://api.test.ndla.no/taxonomy/v1/resourceTypes?language=nb&versionHash=a24";
    const res = withCustomContext({ versionHash: "a24" }, (ctx) => getCacheKey(url, ctx, true));
    expect(res).toEqual(`${url}_a24`);
  });

  it("can be called to ignore version hash by wrapping in withCustomContext", () => {
    const url = "https://api.test.ndla.no/taxonomy/v1/resourceTypes?language=nb";
    const res = withCustomContext({ versionHash: "a24" }, (ctx) => {
      return withCustomContext({ ...ctx, versionHash: undefined }, (innerCtx) => getCacheKey(url, innerCtx, true));
    });

    expect(res).toEqual(url);
  });

  it.each(["no-cache", "No-Store", "no-cache, no-store", "max-age=0, no-cache"])(
    "should detect no-cache directive in '%s'",
    (header) => {
      expect(hasNoCacheDirective(header)).toBe(true);
    },
  );

  it.each([undefined, null, "", "max-age=0", "private", "no-cache-ish"])(
    "should not detect no-cache directive in '%s'",
    (header) => {
      expect(hasNoCacheDirective(header)).toBe(false);
    },
  );

  describe("OATSCacheMiddleware", () => {
    const url = "https://api.test.ndla.no/article-api/v2/articles/1";
    const runOnRequest = (ctx: Partial<ContextWithLoaders>, request: Request) =>
      withCustomContext(ctx as ContextWithLoaders, () =>
        OATSCacheMiddleware().onRequest!({ request } as MiddlewareCallbackParams & { request: Request }),
      );

    it("should return cached response when cache is enabled", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: {} }));
      const result = await runOnRequest({ shouldUseCache: true }, new Request(url));
      expect(result).toBeInstanceOf(Response);
      expect(await (result as Response).text()).toBe("cached");
    });

    it("should bypass cache when context disables cache", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: {} }));
      const request = new Request(url);
      const result = await runOnRequest({ shouldUseCache: false }, request);
      expect(result).toBe(request);
    });

    it("should bypass cache when request has no-store directive", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: {} }));
      const request = new Request(url, { headers: { "cache-control": "no-store" } });
      const result = await runOnRequest({ shouldUseCache: true }, request);
      expect(result).toBe(request);
    });
  });
});
