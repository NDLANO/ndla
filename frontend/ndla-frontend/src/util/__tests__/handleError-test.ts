/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { UNSAFE_ErrorResponseImpl as ErrorResponseImpl } from "react-router";
import { StatusError } from "../error/StatusError";
import { ensureError, getErrorLog } from "../handleError";

test("ensureError keeps the message and status of a route error response instead of '[object Object]'", () => {
  const message = 'You made a POST request to "/" but did not provide an `action` for route "root"';
  const error = ensureError(new ErrorResponseImpl(405, "Method Not Allowed", new Error(message), true));

  expect(error).toBeInstanceOf(StatusError);
  expect(error).toMatchObject({ message, status: 405, logLevel: "info" });
});

test("ensureError logs a 5xx route error response as an error", () => {
  const error = ensureError(new ErrorResponseImpl(503, "Service Unavailable", "Down for maintenance"));

  expect(error).toMatchObject({ message: "Down for maintenance", status: 503, logLevel: "error" });
});

test("getErrorLog serialises the undici cause chain hidden behind 'fetch failed'", () => {
  const cause = Object.assign(new Error("getaddrinfo ENOTFOUND api.local.ndla.no"), {
    code: "ENOTFOUND",
    errno: -3008,
    syscall: "getaddrinfo",
    hostname: "api.local.ndla.no",
  });
  const error = new TypeError("fetch failed", { cause });

  const log = getErrorLog(error, {}) as Record<string, any>;

  expect(log.message).toBe("fetch failed");
  expect(log.cause).toMatchObject({
    message: "getaddrinfo ENOTFOUND api.local.ndla.no",
    code: "ENOTFOUND",
    syscall: "getaddrinfo",
    hostname: "api.local.ndla.no",
  });
});

test("getErrorLog unwraps an AggregateError cause (multiple addresses, e.g. ECONNREFUSED)", () => {
  const inner = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:80"), {
    code: "ECONNREFUSED",
    address: "127.0.0.1",
    port: 80,
  });
  const aggregate = Object.assign(new AggregateError([inner], ""), { code: "ECONNREFUSED" });
  const error = new TypeError("fetch failed", { cause: aggregate });

  const log = getErrorLog(error, {}) as Record<string, any>;

  expect(log.cause.code).toBe("ECONNREFUSED");
  expect(log.cause.errors[0]).toMatchObject({ message: "connect ECONNREFUSED 127.0.0.1:80", port: 80 });
});

test("getErrorLog surfaces the target url/method annotated onto a failed fetch", () => {
  const error = Object.assign(new TypeError("fetch failed"), {
    requestUrl: "https://api.local.ndla.no/graphql-api/graphql",
    requestMethod: "POST",
  });

  const log = getErrorLog(error, {}) as Record<string, any>;

  expect(log.requestUrl).toBe("https://api.local.ndla.no/graphql-api/graphql");
  expect(log.requestMethod).toBe("POST");
});

test("getErrorLog serialises a cause arriving via context (Apollo network errors)", () => {
  const error = new Error("[Network error]: fetch failed");
  const cause = Object.assign(new Error("connect ETIMEDOUT"), { code: "ETIMEDOUT" });

  const log = getErrorLog(error, { cause }) as Record<string, any>;

  expect(log.cause).toMatchObject({ message: "connect ETIMEDOUT", code: "ETIMEDOUT" });
});

test("getErrorLog leaves causeless errors untouched", () => {
  const log = getErrorLog(new Error("boom"), {}) as Record<string, any>;

  expect(log.message).toBe("boom");
  expect(log).not.toHaveProperty("cause");
});
