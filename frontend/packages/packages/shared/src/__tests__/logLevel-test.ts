/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApiError } from "@ndla/api-client";
import { NDLAError, NotFoundError, StatusError } from "../errors";
import { deriveLogLevel, getLogLevelFromStatusCode, mergeLogLevels } from "../logLevel";

test("getLogLevelFromStatusCode treats expected client errors as info", () => {
  [401, 403, 404, 410].forEach((status) => expect(getLogLevelFromStatusCode(status)).toBe("info"));
  expect(getLogLevelFromStatusCode(400)).toBe("warn");
  expect(getLogLevelFromStatusCode(409)).toBe("warn");
  expect(getLogLevelFromStatusCode(500)).toBe("error");
  expect(getLogLevelFromStatusCode(503)).toBe("error");
});

test("mergeLogLevels picks the most severe level", () => {
  expect(mergeLogLevels([])).toBeUndefined();
  expect(mergeLogLevels(["info", "info"])).toBe("info");
  expect(mergeLogLevels(["info", "warn"])).toBe("warn");
  expect(mergeLogLevels(["warn", "error", "info"])).toBe("error");
});

test("deriveLogLevel uses the level of NDLA errors", () => {
  expect(deriveLogLevel(new NDLAError("boom"))).toBe("error");
  expect(deriveLogLevel(new NotFoundError("gone"))).toBe("info");
  expect(deriveLogLevel(new StatusError("bad", 404))).toBe("error");
});

test("deriveLogLevel falls back to the status of the error", () => {
  expect(deriveLogLevel(new ApiError({ status: 404, messages: "", json: null }))).toBe("info");
  expect(deriveLogLevel(new ApiError({ status: 502, messages: "", json: null }))).toBe("error");
  expect(deriveLogLevel(Object.assign(new Error("bad request"), { status: 400 }))).toBe("warn");
});

test("deriveLogLevel is undefined without a status", () => {
  expect(deriveLogLevel(new Error("boom"))).toBeUndefined();
  expect(deriveLogLevel("boom")).toBeUndefined();
  expect(deriveLogLevel(undefined)).toBeUndefined();
});
