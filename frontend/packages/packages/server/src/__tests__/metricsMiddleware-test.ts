/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from "vitest";
import { getExpressRoutePaths, normalizeExpressRoutePath } from "../index";

describe("normalizeExpressRoutePath", () => {
  it("returns unmatched when no express route matched", () => {
    expect(normalizeExpressRoutePath({ route: undefined } as never)).toBe("unmatched");
  });

  it("joins baseUrl and route path", () => {
    expect(normalizeExpressRoutePath({ baseUrl: "/api", route: { path: "/article/:id" } } as never)).toBe(
      "/api/article/:id",
    );
  });

  // `req.path` is router-relative while `req.baseUrl` holds the mount path, so the route paths are matched
  // against `req.path` as-is and only the label is prefixed.
  it("selects the array route path that served a request to a mounted router", () => {
    expect(
      normalizeExpressRoutePath({
        baseUrl: "/api",
        path: "/nb/login",
        route: { path: ["/login", "/:lang/login"] },
      } as never),
    ).toBe("/api/:lang/login");
  });

  it("selects the literal array route path over the parameterized one", () => {
    expect(
      normalizeExpressRoutePath({
        baseUrl: "",
        path: "/login",
        route: { path: ["/login", "/:lang/login"] },
      } as never),
    ).toBe("/login");
  });

  it("selects wildcard array route paths", () => {
    expect(
      normalizeExpressRoutePath({
        baseUrl: "",
        path: "/some/deep/path",
        route: { path: ["/", "/*splat"] },
      } as never),
    ).toBe("/*splat");
  });

  it("keeps array route paths when none matches", () => {
    expect(
      normalizeExpressRoutePath({
        baseUrl: "",
        path: "/unknown",
        route: { path: ["/one", "/two"] },
      } as never),
    ).toBe("/one,/two");
  });

  it("falls back to the joined paths when a route path cannot be compiled", () => {
    expect(
      normalizeExpressRoutePath({
        baseUrl: "",
        path: "/anything",
        route: { path: ["/:", "/also-bad("] },
      } as never),
    ).toBe("/:,/also-bad(");
  });
});

describe("getExpressRoutePaths", () => {
  it("returns an empty list when no express route matched", () => {
    expect(getExpressRoutePaths({ route: undefined } as never)).toEqual([]);
  });

  it("wraps a single route path", () => {
    expect(getExpressRoutePaths({ route: { path: "/article/:id" } } as never)).toEqual(["/article/:id"]);
  });

  it("returns array route paths as-is", () => {
    expect(getExpressRoutePaths({ route: { path: ["/", "/*splat"] } } as never)).toEqual(["/", "/*splat"]);
  });
});
