/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApiError } from "@ndla/api-client";
import type { ErrorEvent, EventHint } from "@sentry/react";
import { beforeSend } from "../sentry";

const knownErrors = [new Error("Failed to fetch"), new Error("[Network error]: Failed to fetch")];

test("beforeSend filters our known errors", () => {
  knownErrors.forEach((error) => {
    const result = beforeSend({} as ErrorEvent, { originalException: error } as EventHint);
    expect(result).toBe(null);
  });
});

test("beforeSend filters informational api errors", () => {
  const error = new ApiError({ status: 404, messages: "Not found", json: null });
  expect(beforeSend({} as ErrorEvent, { originalException: error } as EventHint)).toBe(null);
});

test("beforeSend keeps server errors", () => {
  const error = new ApiError({ status: 500, messages: "Boom", json: null });
  const event = { message: "Boom" } as ErrorEvent;
  expect(beforeSend(event, { originalException: error } as EventHint)).toBe(event);
});
