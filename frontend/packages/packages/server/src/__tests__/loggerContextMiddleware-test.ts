/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createLoggerContextMiddleware, getCorrelationId, getLoggerContextStore, withLoggerContext } from "../index";

const createResponse = () => Object.assign(new EventEmitter(), { locals: {} as Record<string, unknown> });

describe("createLoggerContextMiddleware", () => {
  it("stores request context and exposes correlation id", () => {
    const middleware = createLoggerContextMiddleware();
    const req = { headers: { "x-correlation-id": "correlation-id" }, url: "/path" };
    const next = vi.fn(() => {
      expect(getLoggerContextStore()).toEqual({
        correlationID: "correlation-id",
        requestPath: "/path",
      });
      expect(getCorrelationId()).toBe("correlation-id");
    });

    middleware(req as never, createResponse() as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("stores correlation id in response locals when requested", () => {
    const middleware = createLoggerContextMiddleware({ setCorrelationIdLocal: true });
    const req = { headers: { "x-correlation-id": "correlation-id" }, url: "/path" };
    const res = createResponse();

    middleware(req as never, res as never, vi.fn());

    expect(res.locals.correlationId).toBe("correlation-id");
  });

  it("leaves response locals alone by default", () => {
    const middleware = createLoggerContextMiddleware();
    const req = { headers: { "x-correlation-id": "correlation-id" }, url: "/path" };
    const res = createResponse();

    middleware(req as never, res as never, vi.fn());

    expect(res.locals).toEqual({});
  });

  it("generates a correlation id when the request does not carry one", () => {
    const middleware = createLoggerContextMiddleware();
    const req = { headers: {}, url: "/path" };
    const next = vi.fn(() => {
      expect(getCorrelationId()).toEqual(expect.any(String));
    });

    middleware(req as never, createResponse() as never, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe("withLoggerContext", () => {
  it("runs callback inside the supplied context", () => {
    const value = withLoggerContext({ correlationID: "id", requestPath: "/" }, () => getCorrelationId());

    expect(value).toBe("id");
  });
});
