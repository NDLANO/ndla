/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCorrelationId } from "@ndla/server";
import { apiUrl, slowLogTimeout as configSlowLogTimeout } from "../../config";
import { getHeadersFromContext } from "../apiHelpers";
import { getContextOrThrow } from "../context/contextStore";
import getLogger from "../logger";
import { cacheResponse, getCachedResponse } from "./cachedFetch";
import { toInternalUrl } from "./internalUrl";

export interface ClientCreateOptions {
  disableCache?: boolean;
  baseUrl?: string;
  useTaxonomyCache?: boolean;
}

export function clientConfig(options?: ClientCreateOptions) {
  const fetchRequest = async (request: Request): Promise<Response> => {
    if (options?.disableCache) return fetchFunction(toInternalUrl(request));

    const cached = await getCachedResponse(request, options?.useTaxonomyCache);
    if (cached) return cached;

    const internalRequest = toInternalUrl(request);
    const response = await fetchFunction(internalRequest);
    return cacheResponse(internalRequest, response, options?.useTaxonomyCache);
  };

  return {
    baseUrl: options?.baseUrl ?? apiUrl,
    fetch: (input: Parameters<typeof fetch>[0], init?: RequestInit) =>
      fetchRequest(input instanceof Request && !init ? input : new Request(input, init)),
    parseAs: "json" as const,
    querySerializer: {
      array: {
        style: "form" as const,
        explode: false,
      },
    },
  };
}

const slowLogTimeout = parseInt(configSlowLogTimeout);

async function fetchFunction(req: Request): Promise<Response> {
  const startTime = performance.now();

  const ctx = getContextOrThrow();
  const headers = getHeadersFromContext(ctx);

  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) req.headers.set(key, value);
  }

  const correlationId = getCorrelationId();
  if (correlationId) req.headers.set("x-correlation-id", correlationId);

  const response = await globalThis.fetch(req);

  const elapsedTime = performance.now() - startTime;
  if (elapsedTime > slowLogTimeout) {
    getLogger().info(
      `Fetching '${req.url}' took ${elapsedTime.toFixed(
        2,
      )}ms which is slower than slow log timeout of ${slowLogTimeout}ms`,
    );
  }

  return response;
}
