/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getLoggerContextStore } from "./loggerContextMiddleware";

type FetchInput = Parameters<typeof fetch>[0];

const getRequestUrl = (input: FetchInput): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

const getRequestMethod = (input: FetchInput, init?: RequestInit): string => {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return "GET";
};

/** Wrap the global `fetch` so server-side outgoing requests carry the request's correlation id, letting it reach
 * downstream logs. The W3C `traceparent` is added separately by the OpenTelemetry undici instrumentation.
 * Must be installed once, server-side, during bootstrap. */
export const installCorrelationIdFetch = (): void => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: FetchInput, init?: RequestInit): Promise<Response> => {
    const correlationID = getLoggerContextStore()?.correlationID;
    try {
      if (!correlationID) return await originalFetch(input, init);

      // Normalise to a Request so we can mutate headers regardless of how fetch was called.
      const request = new Request(input, init);
      if (!request.headers.has("x-correlation-id")) {
        request.headers.set("x-correlation-id", correlationID);
      }
      return await originalFetch(request);
    } catch (error) {
      // undici rejects network failures with a bare "fetch failed" TypeError that omits the target.
      // Annotate it so logs identify which downstream call failed; the underlying cause (ENOTFOUND,
      // ECONNREFUSED ...) is serialised separately by `getErrorLog`.
      if (error instanceof Error) {
        Object.assign(error, { requestUrl: getRequestUrl(input), requestMethod: getRequestMethod(input, init) });
      }
      throw error;
    }
  };
};
