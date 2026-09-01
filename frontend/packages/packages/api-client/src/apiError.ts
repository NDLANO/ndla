/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface ApiErrorInit {
  status: number;
  messages: string;
  json: any;
  url?: string;
  statusText?: string;
}

const buildMessage = ({ status, statusText, url, messages }: ApiErrorInit): string => {
  const target = url ? `Api call to ${url}` : "Api call";
  const detail = messages && messages !== statusText ? `: ${messages}` : "";
  return `${target} failed with status ${status}${statusText ? ` ${statusText}` : ""}${detail}`;
};

/** Thrown when an NDLA backend answers with a non-ok status. Carries the parsed body rather than
 * discarding it, so callers can render field level validation errors and logs say what went wrong. */
export class ApiError extends Error {
  readonly status: number;
  readonly messages: string;
  readonly json: any;
  readonly url: string;
  readonly statusText: string;

  constructor(init: ApiErrorInit) {
    super(buildMessage(init));
    this.name = "ApiError";
    this.status = init.status;
    this.messages = init.messages;
    this.json = init.json;
    this.url = init.url ?? "";
    this.statusText = init.statusText ?? "";
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const isNotFoundError = (error: unknown): error is ApiError => isApiError(error) && error.status === 404;
