/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LRUCache } from "lru-cache";
import type { Middleware } from "openapi-fetch";
import { cacheMaxBytes, cacheTtlMs } from "../config";

const cache = new LRUCache<string, string>({
  maxSize: cacheMaxBytes,
  ttl: cacheTtlMs,
  sizeCalculation: (value, key) => value.length + key.length,
});

const uncacheableDirectives = ["no-store", "private", "no-cache"];

export const isCacheableResponse = (response: Response): boolean => {
  if (response.status !== 200) return false;
  const cacheControl = response.headers.get("cache-control")?.toLowerCase() ?? "";
  return !uncacheableDirectives.some((directive) => cacheControl.includes(directive));
};

export const getCached = (key: string): string | undefined => cache.get(key);

export const setCached = (key: string, value: string): void => {
  cache.set(key, value);
};

export const clearCache = (): void => cache.clear();

interface CachedResponse {
  body: string;
  headers: Record<string, string>;
}

export const cacheMiddleware: Middleware = {
  async onRequest({ request }) {
    if (request.method !== "GET") return request;
    const cached = getCached(request.url);
    if (!cached) return request;
    const { body, headers }: CachedResponse = JSON.parse(cached);
    return new Response(body, { status: 200, headers });
  },
  async onResponse({ request, response }) {
    if (request.method !== "GET" || !isCacheableResponse(response)) return response;
    const body = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    setCached(request.url, JSON.stringify({ body, headers } satisfies CachedResponse));
    return new Response(body, { status: response.status, statusText: response.statusText, headers });
  },
};
