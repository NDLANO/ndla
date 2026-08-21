/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCorrelationId } from "@ndla/server";
import { GraphQLError } from "graphql";
import { getCacheKey } from "../../cache";
import { apiUrl, slowLogTimeout as configSlowLogTimeout } from "../../config";
import { getHeadersFromContext } from "../apiHelpers";
import { getContextOrThrow } from "../context/contextStore";
import getLogger from "../logger";
import { isCacheableRequest, readCachedResponse, writeResponseToCache } from "./cache";
import { rewriteToInternalUrl } from "./internalUrl";

/**
 * The shape every generated SDK function resolves to when `throwOnError` is left off. `response`
 * is absent when the request could not be built or the network call itself failed.
 */
export interface ApiResult<TData, TError> {
  data?: TData;
  error?: TError;
  response?: Response;
}

const apiError = (response: Response | undefined, json: unknown): GraphQLError => {
  if (!response) {
    return new GraphQLError("Api call failed before a response was received", { extensions: { json } });
  }
  const message = `Api call to ${response.url} failed with status ${response.status} ${response.statusText}`;
  return new GraphQLError(message, { extensions: { status: response.status, json } });
};

export const resolveOATS = async <TData, TError>(res: ApiResult<TData, TError>) => {
  const { data, response, error } = res;
  if (response?.ok) return data;

  throw apiError(response, error ?? data);
};

/** Resolves a response from a generated SDK function and asserts that the response is successful */
export const resolveJsonOATS = async <TData, TError>(res: ApiResult<TData, TError>) => {
  const { data, response, error } = res;
  if (response?.ok && data) return data;
  throw apiError(response, error ?? data);
};

export interface ClientCreateOptions {
  disableCache?: boolean;
  baseUrl?: string;
  useTaxonomyCache?: boolean;
}

/** Configuration every api module passes to its generated `createClient()`. */
export function apiClientConfig(options?: ClientCreateOptions) {
  return {
    baseUrl: options?.baseUrl ?? apiUrl,
    fetch: createFetchFunction(options),
    querySerializer: {
      array: {
        style: "form" as const,
        explode: false,
      },
    },
  };
}

const slowLogTimeout = parseInt(configSlowLogTimeout);

/**
 * Caching and the internal-url rewrite live here rather than in interceptors: a request
 * interceptor must return a `Request`, so it cannot short-circuit a cache hit with a `Response`.
 */
function createFetchFunction(options?: ClientCreateOptions): typeof fetch {
  return async function fetchFunction(input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
    const startTime = performance.now();
    const req = input instanceof Request ? input : new Request(input, init);

    const ctx = getContextOrThrow();
    const cacheEnabled = !options?.disableCache;
    // The key is derived from the url as the caller wrote it, before the internal-url rewrite,
    // so reads and writes agree on it.
    const cacheKey = cacheEnabled ? getCacheKey(req.url, ctx, options?.useTaxonomyCache) : null;

    // Cacheability is decided before the context headers are applied, matching the order the
    // cache middleware used to run in.
    if (cacheKey && isCacheableRequest(req)) {
      const cached = await readCachedResponse(cacheKey);
      if (cached) return cached;
    }

    const headers = getHeadersFromContext(ctx);

    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) req.headers.set(key, value);
    }

    const correlationId = getCorrelationId();
    if (correlationId) req.headers.set("x-correlation-id", correlationId);

    const request = rewriteToInternalUrl(req);
    let response = await globalThis.fetch(request);

    if (cacheKey) {
      response = await writeResponseToCache(cacheKey, request, response);
    }

    const elapsedTime = performance.now() - startTime;
    if (elapsedTime > slowLogTimeout) {
      getLogger().info(
        `Fetching '${request.url}' took ${elapsedTime.toFixed(
          2,
        )}ms which is slower than slow log timeout of ${slowLogTimeout}ms`,
      );
    }

    return response;
  };
}
