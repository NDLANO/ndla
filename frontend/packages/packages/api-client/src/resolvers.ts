/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FetchResponse } from "openapi-fetch";
import type { MediaType } from "openapi-typescript-helpers";
import { ApiError } from "./apiError";

const getMessages = (body: unknown, fallback: string): string => {
  if (typeof body === "string") return body || fallback;
  if (!body || typeof body !== "object") return fallback;
  if ("messages" in body && typeof body.messages === "string") return body.messages;
  if ("description" in body && typeof body.description === "string") return body.description;
  if ("message" in body && typeof body.message === "string") return body.message;
  return fallback;
};

const toApiError = (response: Response, body: unknown, fallback = response.statusText): ApiError =>
  new ApiError({
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    messages: getMessages(body, fallback),
    json: body,
  });

/** Reads the body as json, falling back to the raw text when it isn't parseable. Error responses
 * from a proxy or a load balancer are regularly html, and that text says more than a parse error. */
const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** Resolves a response from an openapi-fetch client, asserting only that the call succeeded. Use it
 * for endpoints that legitimately answer with no body, such as a 204 from a delete. */
export const resolveOATS = async <A extends Record<string | number, any>, B, C extends MediaType>(
  res: FetchResponse<A, B, C>,
) => {
  const { data, response, error } = res;
  if (response.ok) return data;
  throw toApiError(response, error ?? data);
};

/** Resolves a response from an openapi-fetch client, asserting that the call succeeded and returned a body. */
export const resolveJsonOATS = async <A extends Record<string | number, any>, B, C extends MediaType>(
  res: FetchResponse<A, B, C>,
) => {
  const { data, response, error } = res;
  if (response.ok && data) return data;
  throw toApiError(response, error ?? data);
};

export const resolveJsonOrRejectWithError = async <T>(res: Response): Promise<T> => {
  const body = await parseBody(res);
  if (!res.ok) throw toApiError(res, body);
  if (body === undefined || typeof body === "string") {
    throw toApiError(res, body, "The call succeeded, but answered without a json body");
  }
  return body as T;
};
