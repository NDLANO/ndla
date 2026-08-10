/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { trace } from "@opentelemetry/api";
import { describe, expect, it, vi } from "vitest";
import { createFixedSpanNamingMiddleware, createSpanNamingMiddleware, getFirstPathSegmentRouteName } from "../index";

describe("createSpanNamingMiddleware", () => {
  it("updates active span with resolved route name", () => {
    const updateName = vi.fn();
    const setAttribute = vi.fn();
    vi.spyOn(trace, "getActiveSpan").mockReturnValue({ updateName, setAttribute } as never);
    const next = vi.fn();

    createSpanNamingMiddleware(() => "/subjects")({ method: "GET" } as never, {} as never, next);

    expect(updateName).toHaveBeenCalledWith("GET /subjects");
    expect(setAttribute).toHaveBeenCalledWith("http.route", "/subjects");
    expect(next).toHaveBeenCalledOnce();
  });

  it("supports fixed route names", () => {
    const updateName = vi.fn();
    const setAttribute = vi.fn();
    vi.spyOn(trace, "getActiveSpan").mockReturnValue({ updateName, setAttribute } as never);

    createFixedSpanNamingMiddleware("/graphql")({ method: "POST" } as never, {} as never, vi.fn());

    expect(updateName).toHaveBeenCalledWith("POST /graphql");
  });
});

describe("getFirstPathSegmentRouteName", () => {
  it("returns first path segment", () => {
    expect(getFirstPathSegmentRouteName("/articles/1/edit")).toBe("/articles");
  });

  it("returns root for root path", () => {
    expect(getFirstPathSegmentRouteName("/")).toBe("/");
  });
});
