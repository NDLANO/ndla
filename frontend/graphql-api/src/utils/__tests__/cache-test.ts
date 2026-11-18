/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MiddlewareCallbackParams } from "openapi-fetch";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCache,
  getCache,
  getCacheKey,
  hasNoCacheDirective,
  isVariedBy,
  setHeaderIfShouldNotCache,
} from "../../cache";
import { getApiLabel, metricsRegistry } from "../../metrics";
import { withCustomContext } from "../context/contextStore";
import { externalFetch } from "../fetch";
import { OATSCacheDisabledMiddleware, OATSCacheMiddleware } from "../openapi-fetch/cacheMiddleware";

const counted = async (name: string) => {
  const metric = await metricsRegistry.getSingleMetric(name)?.get();
  return (metric?.values ?? []).filter(({ value }) => value > 0).map(({ labels, value }) => ({ ...labels, value }));
};

describe("Cache", () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics();
  });

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

  it.each<[string | null, boolean]>([
    ["FeideAuthorization", true],
    ["Accept-Encoding, feideauthorization", true],
    ["*", true],
    ["Accept-Encoding", false],
    [" , ", false],
    [null, false],
  ])("should check vary '%s' against request headers", (vary, expected) => {
    expect(isVariedBy(vary, new Headers({ FeideAuthorization: "Bearer token" }))).toBe(expected);
  });

  describe("setHeaderIfShouldNotCache", () => {
    const run = (preset: string | undefined, cacheControl: string | undefined) => {
      let header = preset;
      const res = {
        getHeader: () => header,
        setHeader: (_: string, value: string) => {
          header = value;
        },
      };
      const response = new Response(null, { headers: cacheControl ? { "cache-control": cacheControl } : {} });
      const shouldCache = setHeaderIfShouldNotCache(response, { res } as unknown as Context);
      return { shouldCache, header };
    };

    it.each(["private", "private, max-age=0", "no-cache, no-store", 'private="set-cookie"', "No-Store"])(
      "should not cache response with '%s'",
      (cacheControl) => {
        expect(run(undefined, cacheControl).shouldCache).toBe(false);
      },
    );

    it.each([undefined, "max-age=300", "public, max-age=300"])("should cache response with '%s'", (cacheControl) => {
      expect(run(undefined, cacheControl).shouldCache).toBe(true);
    });

    it("should keep the strictest cache-control on the response", () => {
      expect(run("no-store", "private").header).toBe("no-store");
      expect(run("private", "no-cache").header).toBe("private");
      expect(run("no-cache", "private, max-age=0").header).toBe("private, max-age=0");
      expect(run(undefined, "max-age=300").header).toBeUndefined();
    });
  });

  describe("OATSCacheMiddleware", () => {
    const url = "https://api.test.ndla.no/article-api/v2/articles/1";
    const runOnRequest = (ctx: Partial<ContextWithLoaders>, request: Request) =>
      withCustomContext(ctx as ContextWithLoaders, () =>
        OATSCacheMiddleware().onRequest!({ request } as MiddlewareCallbackParams & { request: Request }),
      );

    const lookup = (result: string, reason: string, api = "article-api") => [{ api, result, reason, value: 1 }];

    it("should return cached response when cache is enabled", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: {} }));
      const result = await runOnRequest({ shouldUseCache: true }, new Request(url));
      expect(result).toBeInstanceOf(Response);
      expect(await (result as Response).text()).toBe("cached");
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("hit", "fresh"));
    });

    it("should count a miss when nothing is cached", async () => {
      const request = new Request("https://api.test.ndla.no/taxonomy/v1/nodes?not-cached=1");
      const result = await runOnRequest({ shouldUseCache: true }, request);
      expect(result).toBe(request);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("miss", "absent", "taxonomy"));
    });

    it("should bypass cache when context disables cache", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: {} }));
      const request = new Request(url);
      const result = await runOnRequest({ shouldUseCache: false }, request);
      expect(result).toBe(request);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("bypass", "client_no_cache"));
    });

    it("should bypass cache when request has no-store directive", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: {} }));
      const request = new Request(url, { headers: { "cache-control": "no-store" } });
      const result = await runOnRequest({ shouldUseCache: true }, request);
      expect(result).toBe(request);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("bypass", "request_no_cache"));
    });

    it("should bypass cache for requests that aren't GET", async () => {
      const request = new Request(url, { method: "POST" });
      const result = await runOnRequest({ shouldUseCache: true }, request);
      expect(result).toBe(request);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("bypass", "method"));
    });

    it("should return cached response without vary to a feide user", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: {} }));
      const result = await runOnRequest({ shouldUseCache: true, feideAuthorization: "Bearer token" }, new Request(url));
      expect(result).toBeInstanceOf(Response);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("hit", "fresh"));
    });

    it("should return cached response that varies on a header the request doesn't send", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: { vary: "FeideAuthorization" } }));
      const result = await runOnRequest({ shouldUseCache: true }, new Request(url));
      expect(result).toBeInstanceOf(Response);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("hit", "fresh"));
    });

    it("should bypass cached response that varies on a header the request sends", async () => {
      await getCache().set(url, JSON.stringify({ body: "cached", headers: { vary: "FeideAuthorization" } }));
      const request = new Request(url);
      const result = await runOnRequest({ shouldUseCache: true, feideAuthorization: "Bearer token" }, request);
      expect(result).toBe(request);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual(lookup("miss", "vary"));
    });

    const runOnResponse = (ctx: Partial<Context>, request: Request, response: Response) => {
      const res = { getHeader: () => undefined, setHeader: () => {} };
      return withCustomContext({ ...ctx, res } as unknown as ContextWithLoaders, () =>
        OATSCacheMiddleware().onResponse!({ request, response } as MiddlewareCallbackParams & {
          request: Request;
          response: Response;
        }),
      );
    };

    const write = (result: string, reason: string, api = "article-api") => [{ api, result, reason, value: 1 }];

    it("should write response to cache when cache is enabled", async () => {
      const responseUrl = "https://api.test.ndla.no/learningpath-api/v2/learningpaths/1";
      await runOnResponse({ shouldUseCache: true }, new Request(responseUrl), new Response("fresh", { status: 200 }));
      expect(await getCache().get(responseUrl)).toContain("fresh");
      expect(await counted("graphql_api_cache_writes_total")).toEqual(write("stored", "cacheable", "learningpath-api"));
    });

    it("should not write response with a status other than 200", async () => {
      const responseUrl = "https://api.test.ndla.no/article-api/v2/articles/404";
      await runOnResponse({ shouldUseCache: true }, new Request(responseUrl), new Response("gone", { status: 404 }));
      expect(await getCache().get(responseUrl)).toBeUndefined();
      expect(await counted("graphql_api_cache_writes_total")).toEqual(write("skipped", "status"));
    });

    it("should not write private response", async () => {
      const responseUrl = "https://api.test.ndla.no/article-api/v2/articles/3";
      const response = new Response("teacher", { status: 200, headers: { "cache-control": "private" } });
      await runOnResponse({ shouldUseCache: true }, new Request(responseUrl), response);
      expect(await getCache().get(responseUrl)).toBeUndefined();
      expect(await counted("graphql_api_cache_writes_total")).toEqual(write("skipped", "cache_control"));
    });

    it("should not write response to cache when context disables cache", async () => {
      const responseUrl = "https://api.test.ndla.no/learningpath-api/v2/learningpaths/2";
      await runOnResponse(
        { shouldUseCache: false },
        new Request(responseUrl),
        new Response("personal", { status: 200 }),
      );
      expect(await getCache().get(responseUrl)).toBeUndefined();
      expect(await counted("graphql_api_cache_writes_total")).toEqual([]);
    });

    it("should not write response to cache when request has no-store directive", async () => {
      const responseUrl = "https://api.test.ndla.no/search-api/v1/search?query=test";
      const request = new Request(responseUrl, { headers: { "cache-control": "no-store" } });
      await runOnResponse({ shouldUseCache: true }, request, new Response("results", { status: 200 }));
      expect(await getCache().get(responseUrl)).toBeUndefined();
      expect(await counted("graphql_api_cache_writes_total")).toEqual([]);
    });

    it("should write response that varies on a header the request doesn't send", async () => {
      const responseUrl = "https://api.test.ndla.no/article-api/v2/articles/ids?ids=1";
      const response = new Response("public", { status: 200, headers: { vary: "FeideAuthorization" } });
      await runOnResponse({ shouldUseCache: true }, new Request(responseUrl), response);
      expect(await getCache().get(responseUrl)).toContain("public");
      expect(await counted("graphql_api_cache_writes_total")).toEqual(write("stored", "cacheable"));
    });

    it("should not write response that varies on a header the request sends", async () => {
      const responseUrl = "https://api.test.ndla.no/article-api/v2/articles/ids?ids=2";
      const response = new Response("teacher", { status: 200, headers: { vary: "FeideAuthorization" } });
      await runOnResponse(
        { shouldUseCache: true, feideAuthorization: "Bearer token" },
        new Request(responseUrl),
        response,
      );
      expect(await getCache().get(responseUrl)).toBeUndefined();
      expect(await counted("graphql_api_cache_writes_total")).toEqual(write("skipped", "vary"));
    });
  });

  describe("OATSCacheDisabledMiddleware", () => {
    it.each([
      ["GET", "disabled"],
      ["POST", "method"],
    ])("should count %s requests as bypassed because of %s", async (method, reason) => {
      const request = new Request("https://api.test.ndla.no/myndla-api/v1/folders", { method });
      const result = await OATSCacheDisabledMiddleware.onRequest!({ request } as MiddlewareCallbackParams & {
        request: Request;
      });
      expect(result).toBe(request);
      expect(await counted("graphql_api_cache_lookups_total")).toEqual([
        { api: "myndla-api", result: "bypass", reason, value: 1 },
      ]);
    });
  });

  describe("externalFetch", () => {
    const ctx = {
      shouldUseCache: true,
      res: { getHeader: () => undefined, setHeader: () => {} },
    } as unknown as Context;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should count a miss and a write, then a hit", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("external", { status: 200 }));
      const url = "https://example.com/external-fetch-test";

      await externalFetch(url, ctx);
      await externalFetch(url, ctx);

      expect(await counted("graphql_api_cache_lookups_total")).toEqual([
        { api: "external", result: "miss", reason: "absent", value: 1 },
        { api: "external", result: "hit", reason: "fresh", value: 1 },
      ]);
      expect(await counted("graphql_api_cache_writes_total")).toEqual([
        { api: "external", result: "stored", reason: "cacheable", value: 1 },
      ]);
    });

    it("should count HEAD requests as bypassed", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(null, { status: 200 }));
      await externalFetch("https://example.com/file.pdf", ctx, { method: "HEAD" });
      expect(await counted("graphql_api_cache_lookups_total")).toEqual([
        { api: "external", result: "bypass", reason: "method", value: 1 },
      ]);
    });
  });

  describe("cache removals", () => {
    it("should count entries evicted because the cache is full", async () => {
      const cache = createCache({ size: 10 });
      await cache.set("a", "12345");
      await cache.set("b", "12345");
      expect(await cache.get("a")).toBeUndefined();
      expect(await counted("graphql_api_cache_removals_total")).toEqual([{ reason: "evict", value: 1 }]);
    });

    it("should count entries removed because they expired", async () => {
      const cache = createCache({ size: 100 });
      await cache.set("a", "12345", 1);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(await cache.get("a")).toBeUndefined();
      expect(await counted("graphql_api_cache_removals_total")).toEqual([{ reason: "expire", value: 1 }]);
    });
  });

  it.each([
    ["https://api.test.ndla.no/article-api/v2/articles/1", "article-api"],
    ["http://api-gateway.ndla-local/taxonomy/v1/nodes", "taxonomy"],
    ["https://api.test.ndla.no/", "other"],
    ["https://api.test.ndla.no/Weird_Path/1", "other"],
  ])("should label %s with api %s", (url, api) => {
    expect(getApiLabel(url)).toBe(api);
  });
});
