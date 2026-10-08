/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApiError } from "./apiError";

/** The result of a call through a generated Hey API sdk function. `response` is missing when the request never got
 * an answer, in which case `error` holds what the fetch threw. */
export interface ApiResult<TData> {
  data: TData | undefined;
  error: unknown;
  response?: Response;
}

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

const hasEmptyBody = (response: Response) => response.status === 204 || response.headers.get("Content-Length") === "0";

/** Returns the raw response of a call, rethrowing whatever the fetch threw if the request never got an answer. */
export const resolveResponse = <T>({ response, error }: ApiResult<T>): Response => {
  if (!response) throw error;
  return response;
};

/** Resolves a response from a Hey API sdk function, asserting only that the call succeeded. Use it
 * for endpoints that legitimately answer with no body, such as a 204 from a delete. */
export const resolveOATS = async <T>(res: ApiResult<T>): Promise<T> => {
  const response = resolveResponse(res);
  if (!response.ok) throw toApiError(response, res.error ?? res.data);
  return (hasEmptyBody(response) ? undefined : res.data) as T;
};

type WithJsonBody<T> = [Exclude<T, void | undefined>] extends [never]
  ? {
      "this endpoint answers without a json body, use resolveOATS instead": never;
    }
  : unknown;

/** Resolves a response from a Hey API sdk function, asserting that the call succeeded and returned a body. */
export const resolveJsonOATS = async <T extends WithJsonBody<T>>(res: ApiResult<T>): Promise<NonNullable<T>> => {
  const response = resolveResponse(res);
  if (response.ok && !hasEmptyBody(response) && res.data) return res.data;
  throw toApiError(response, res.error ?? res.data);
};

export const resolveJsonOrRejectWithError = async <T>(res: Response): Promise<T> => {
  const body = await parseBody(res);
  if (!res.ok) throw toApiError(res, body);
  if (body === undefined || typeof body === "string") {
    throw toApiError(res, body, "The call succeeded, but answered without a json body");
  }
  return body as T;
};
