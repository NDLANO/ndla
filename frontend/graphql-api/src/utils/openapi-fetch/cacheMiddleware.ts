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
import { getHeadersFromContext } from "../apiHelpers";
import { getContextOrThrow } from "../context/contextStore";

function isCacheableRequest(request: Request, ctx: Context): boolean {
  return ctx.shouldUseCache && request.method === "GET" && !hasNoCacheDirective(request.headers.get("Cache-Control"));
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

export const OATSCacheMiddleware = (useTaxonomyCache?: boolean): Middleware => ({
  async onRequest({ request }) {
    const ctx = getContextOrThrow();
    if (!isCacheableRequest(request, ctx)) return request;

    const cacheKey = getCacheKey(request.url, ctx, useTaxonomyCache);
    const data = await getCache().get(cacheKey);
    const cached = cachedResponse(data);
    if (!cached || isVariedBy(cached.headers.get("vary"), getOutgoingHeaders(request, ctx))) return request;
    return cached;
  },
  async onResponse({ request, response }) {
    const ctx = getContextOrThrow();
    const shouldCache = setHeaderIfShouldNotCache(response, ctx);
    if (
      response.status !== 200 ||
      !shouldCache ||
      !isCacheableRequest(request, ctx) ||
      isVariedBy(response.headers.get("vary"), getOutgoingHeaders(request, ctx))
    ) {
      return;
    }

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
