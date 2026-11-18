/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Middleware } from "openapi-fetch";
import {
  cacheTime,
  getCache,
  getCacheKey,
  hasNoCacheDirective,
  isVariedBy,
  setHeaderIfShouldNotCache,
} from "../../cache";
import { type CacheBypassReason, type CacheWrite, countCacheLookup, countCacheWrite, getApiLabel } from "../../metrics";
import { getHeadersFromContext } from "../apiHelpers";
import { getContextOrThrow } from "../context/contextStore";

function getBypassReason(request: Request, ctx: Context): CacheBypassReason | undefined {
  if (!ctx.shouldUseCache) return "client_no_cache";
  if (request.method !== "GET") return "method";
  if (hasNoCacheDirective(request.headers.get("Cache-Control"))) return "request_no_cache";
  return undefined;
}

function getWriteSkipReason(
  request: Request,
  response: Response,
  shouldCache: boolean,
  ctx: Context,
): Extract<CacheWrite, { result: "skipped" }>["reason"] | undefined {
  if (response.status !== 200) return "status";
  if (!shouldCache) return "cache_control";
  if (isVariedBy(response.headers.get("vary"), getOutgoingHeaders(request, ctx))) return "vary";
  return undefined;
}

function getOutgoingHeaders(request: Request, ctx: Context): Headers {
  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(getHeadersFromContext(ctx))) {
    if (value) headers.set(key, value);
  }
  return headers;
}

export function cachedResponse(data: string | undefined): Response | null {
  if (!data) return null;

  const { body, headers } = JSON.parse(data);
  return new Response(body, {
    headers,
    status: 200,
  });
}

export const OATSCacheDisabledMiddleware: Middleware = {
  async onRequest({ request }) {
    countCacheLookup(getApiLabel(request.url), {
      result: "bypass",
      reason: request.method === "GET" ? "disabled" : "method",
    });
    return request;
  },
};

export const OATSCacheMiddleware = (useTaxonomyCache?: boolean): Middleware => ({
  async onRequest({ request }) {
    const ctx = getContextOrThrow();
    const api = getApiLabel(request.url);
    const bypassReason = getBypassReason(request, ctx);
    if (bypassReason) {
      countCacheLookup(api, { result: "bypass", reason: bypassReason });
      return request;
    }

    const cacheKey = getCacheKey(request.url, ctx, useTaxonomyCache);
    const data = await getCache().get(cacheKey);
    const cached = cachedResponse(data);
    if (!cached) {
      countCacheLookup(api, { result: "miss", reason: "absent" });
      return request;
    }
    if (isVariedBy(cached.headers.get("vary"), getOutgoingHeaders(request, ctx))) {
      countCacheLookup(api, { result: "miss", reason: "vary" });
      return request;
    }
    countCacheLookup(api, { result: "hit", reason: "fresh" });
    return cached;
  },
  async onResponse({ request, response }) {
    const ctx = getContextOrThrow();
    const shouldCache = setHeaderIfShouldNotCache(response, ctx);
    if (getBypassReason(request, ctx)) return;

    const api = getApiLabel(request.url);
    const skipReason = getWriteSkipReason(request, response, shouldCache, ctx);
    if (skipReason) {
      countCacheWrite(api, { result: "skipped", reason: skipReason });
      return;
    }
    countCacheWrite(api, { result: "stored", reason: "cacheable" });

    const cacheKey = getCacheKey(request.url, ctx, useTaxonomyCache);
    const headers: Record<string, unknown> = {};
    const body = await response.text();
    response.headers.forEach((value, key) => (headers[key] = value));
    await getCache().set(
      cacheKey,
      JSON.stringify({
        body,
        headers,
      }),
      cacheTime,
    );

    const responseOpts: ResponseInit = {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    };

    if (!body) return new Response(null, responseOpts);
    else return new Response(body, responseOpts);
  },
});
