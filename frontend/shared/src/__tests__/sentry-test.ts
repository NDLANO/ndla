/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventHint, ErrorEvent } from "@sentry/react";
import { createBeforeSend } from "../sentry";

const beforeSend = createBeforeSend(() => false);

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

const exceptionEvent = (type: string, value: string, filenames: string[]) =>
  ({
    exception: { values: [{ type, value, stacktrace: { frames: filenames.map((filename) => ({ filename })) } }] },
  }) as ErrorEvent;

const sendEvent = (event: ErrorEvent) => beforeSend(event, {} as EventHint);

test("beforeSend drops errors thrown by the Formbricks SDK", () => {
  const configNull = exceptionEvent("Error", "config is null, maybe the init function was not called?", [
    "https://ndla.no/assets/entry.client-BkF3x9.js",
    "https://app.formbricks.com/js/formbricks.umd.cjs",
    "https://app.formbricks.com/js/formbricks.umd.cjs",
  ]);
  const missingWorkspace = exceptionEvent(
    "TypeError",
    "undefined is not an object (evaluating 't.get().workspace.data')",
    ["/js/formbricks.umd.cjs"],
  );
  expect(sendEvent(configNull)).toBe(null);
  expect(sendEvent(missingWorkspace)).toBe(null);
});

test("beforeSend keeps errors with only first-party frames", () => {
  const event = exceptionEvent("TypeError", "Cannot read properties of undefined (reading 'data')", [
    "https://ndla.no/assets/entry.client-BkF3x9.js",
    "https://ndla.no/assets/ResourcePage-NqG1VLSs.js",
  ]);
  expect(sendEvent(event)).toBe(event);
});

test("beforeSend drops informational errors", () => {
  const error = new Error("Not found");
  const beforeSend = createBeforeSend((exception) => exception === error);
  expect(beforeSend({} as ErrorEvent, { originalException: error } as EventHint)).toBe(null);
});
