/**
 * Copyright (c) 2018-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type NdlaErrorFields = {
  status: number;
  messages: string;
  json: any;
};

export type NdlaErrorPayload = NdlaErrorFields & Error;

export class NdlaApiError extends Error {
  status: number;
  messages: string;
  json: any;
  constructor({ status, messages, json }: NdlaErrorFields) {
    super("");
    this.status = status;
    this.messages = messages;
    this.json = json;
  }
}

export function isNotFoundError(err: any): err is NdlaApiError {
  return err instanceof NdlaApiError && err.status === 404;
}

export function isNdlaApiError(err: any): err is NdlaErrorPayload {
  return err instanceof NdlaApiError;
}

function buildErrorPayload(status: number, messages: string, json: any): NdlaErrorPayload {
  return new NdlaApiError({ status, json, messages });
}

export function throwErrorPayload(status: number, messages: string, json: any) {
  throw buildErrorPayload(status, messages, json);
}

export const onError = (err: NdlaErrorPayload & { statusText?: string }) => {
  throwErrorPayload(err.status, err.message ?? err.statusText ?? "", err);
};

export const resolveLocation = (res: Response | undefined): Promise<string> => {
  return new Promise((resolve, reject) => {
    const location = res?.headers.get("Location");
    if (res?.status === 201 && location) {
      return resolve(location);
    }
    return reject(throwErrorPayload(res?.status || -1, "Location does not exist!", null));
  });
};

export interface ResolveOptions<T> {
  alternateResolve?: (res: Response, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => T;
}

const getErrorMessages = (err: unknown): string | undefined => {
  if (!err || typeof err !== "object") return;
  if ("messages" in err && typeof err.messages === "string") return err.messages;
  if ("description" in err && typeof err.description === "string") return err.description;
  return undefined;
};

/**
 * The shape every generated SDK function resolves to when `throwOnError` is left off. `response`
 * is absent when the request could not be built or the network call itself failed.
 */
export interface ApiResult<TData, TError> {
  data?: TData;
  error?: TError;
  response?: Response;
}

const apiError = (response: Response | undefined, error: unknown): NdlaErrorPayload =>
  buildErrorPayload(response?.status ?? -1, getErrorMessages(error) ?? response?.statusText ?? "", error);

export const resolveOATS = async <TData, TError>(res: ApiResult<TData, TError>) => {
  const { data, response, error } = res;
  if (response?.ok) return data;
  throw apiError(response, error);
};

/** Resolves a response from a generated SDK function and asserts that the response is successful */
export const resolveJsonOATS = async <TData, TError>(res: ApiResult<TData, TError>) => {
  const { data, response, error } = res;
  if (response?.ok && data) return data;
  throw apiError(response, error);
};

export const resolveJsonOrRejectWithError = <T>(
  res: Response,
  { alternateResolve }: ResolveOptions<T> = {},
): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (res.ok) {
      if (alternateResolve) {
        const r = alternateResolve(res, resolve, reject);
        if (r) return r;
      }
      return resolve(res.json());
    }

    return res
      .json()
      .then((json) => {
        reject(throwErrorPayload(res.status, json.messages ?? json.description ?? res.statusText, json));
      })
      .catch(reject);
  });
};
