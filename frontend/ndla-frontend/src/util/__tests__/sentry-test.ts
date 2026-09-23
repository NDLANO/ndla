/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventHint, ErrorEvent } from "@sentry/react";
import { beforeSend } from "../sentry";

const knownErrors = [
  new Error('Object.prototype.hasOwnProperty.call(o,"telephone")'),
  new Error('Object.prototype.hasOwnProperty.call(e,"telephone")'),
  new Error("'get' on proxy: property 'javaEnabled' is a read-only and non-configurable data property"),
];

test("beforeSend filters our known errors", () => {
  knownErrors.forEach((error) => {
    const result = beforeSend({} as ErrorEvent, { originalException: error } as EventHint);
    expect(result).toBe(null);
  });
});

const fetchFailures = [
  "Failed to fetch",
  "Failed to fetch (api.ndla.no)",
  "[Network error]: Failed to fetch",
  "Load failed (api.ndla.no)",
  "NetworkError when attempting to fetch resource. (api.ndla.no)",
];

const send = (message: string) => beforeSend({} as ErrorEvent, { originalException: new Error(message) } as EventHint);

afterEach(() => vi.restoreAllMocks());

test("beforeSend drops unsampled fetch failures", () => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  fetchFailures.forEach((message) => expect(send(message)).toBe(null));
});

test("beforeSend keeps and tags sampled fetch failures", () => {
  vi.spyOn(Math, "random").mockReturnValue(0);
  fetchFailures.forEach((message) => expect(send(message)?.tags?.sampled).toBe("fetch-failure"));
});

test("beforeSend drops fetch failures while offline", () => {
  vi.spyOn(Math, "random").mockReturnValue(0);
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  expect(send("Failed to fetch (api.ndla.no)")).toBe(null);
});

test("beforeSend does not treat chunk load errors as fetch failures", () => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  const event = send("Failed to fetch dynamically imported module: https://ndla.no/static/ResourcePage-NqG1VLSs.js");
  expect(event).not.toBe(null);
  expect(event?.tags?.sampled).toBeUndefined();
});
