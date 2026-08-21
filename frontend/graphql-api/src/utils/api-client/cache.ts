/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { cacheTime, getCache, setHeaderIfShouldNotCache } from "../../cache";
import { getContextOrThrow } from "../context/contextStore";

export function cachedResponse(data: string | undefined): Response | null {
  if (!data) return null;

  const { body, headers } = JSON.parse(data);
  return new Response(body, {
    headers,
    status: 200,
  });
}

export function isCacheableRequest(request: Request): boolean {
  const cacheControl = request.headers.get("Cache-Control");

  return (
    (request.method === undefined || request.method === "GET") &&
    cacheControl !== "no-store" &&
    cacheControl !== "reload"
  );
}

export async function readCachedResponse(cacheKey: string): Promise<Response | null> {
  return cachedResponse(await getCache().get(cacheKey));
}

/**
 * Stores a cacheable response and returns a replacement, since reading the body to cache it
 * consumes the original. Returns the untouched response when it shouldn't be cached.
 */
export async function writeResponseToCache(cacheKey: string, request: Request, response: Response): Promise<Response> {
  const ctx = getContextOrThrow();
  const shouldCache = setHeaderIfShouldNotCache(response, ctx);
  if (response.status !== 200 || !shouldCache || request.method !== "GET") return response;

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

  const responseOpts = {
    headers: response.headers,
    status: response.status,
  };

  if (!body) return new Response(null, responseOpts);
  else return new Response(body, responseOpts);
}
