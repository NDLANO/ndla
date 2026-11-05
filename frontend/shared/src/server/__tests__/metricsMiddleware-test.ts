/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer, type Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMetricsMiddleware,
  getExpressRoutePaths,
  normalizeExpressRoutePath,
  type MetricsMiddlewareOptions,
} from "../index";

describe("createMetricsMiddleware", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve) => {
            server.closeAllConnections();
            server.close(() => resolve());
          }),
      ),
    );
  });

  const listen = async (options?: MetricsMiddlewareOptions, onSlowRequest?: () => void) => {
    const app = express();
    app.use(createMetricsMiddleware(options));
    const router = express.Router();
    router.get("/article/:id", (_req, res) => {
      res.send("ok");
    });
    app.use("/api", router);
    app.get("/health", (_req, res) => {
      res.send("ok");
    });
    app.get("/slow", () => onSlowRequest?.());

    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const address = server.address();
    const url = `http://localhost:${typeof address === "object" && address !== null ? address.port : ""}`;
    const get = (path: string) => fetch(`${url}${path}`).then((res) => res.text());
    return { url, get };
  };

  it("records request durations labeled with status code, method and route path", async () => {
    const { get } = await listen();
    await get("/api/article/1");
    await get("/api/article/2");
    await get("/nope");

    const metrics = await get("/metrics");
    expect(metrics).toContain(
      'http_request_duration_seconds_count{status_code="200",method="GET",path="/api/article/:id"} 2',
    );
    expect(metrics).toContain('http_request_duration_seconds_count{status_code="404",method="GET",path="unmatched"} 1');
    expect(metrics).toContain("up 1");
  });

  it("leaves out the path label when includePath is false", async () => {
    const { get } = await listen({ includePath: false });
    await get("/api/article/1");

    expect(await get("/metrics")).toContain('http_request_duration_seconds_count{status_code="200",method="GET"} 1');
  });

  it("labels the path with a custom normalizePath", async () => {
    const { get } = await listen({ normalizePath: () => "/custom" });
    await get("/api/article/1");

    expect(await get("/metrics")).toContain(
      'http_request_duration_seconds_count{status_code="200",method="GET",path="/custom"} 1',
    );
  });

  it("does not record health checks", async () => {
    const { get } = await listen();
    await get("/health");
    await get("/health/liveness");

    expect(await get("/metrics")).not.toContain("http_request_duration_seconds_count");
  });

  it("records requests closed by the client with status code 499", async () => {
    let requestReceived = (): void => {};
    const received = new Promise<void>((resolve) => {
      requestReceived = resolve;
    });
    const { url, get } = await listen({}, () => requestReceived());

    const controller = new AbortController();
    const request = fetch(`${url}/slow`, { signal: controller.signal }).catch(() => undefined);
    await received;
    controller.abort();
    await request;

    await vi.waitFor(async () => {
      expect(await get("/metrics")).toContain(
        'http_request_duration_seconds_count{status_code="499",method="GET",path="/slow"} 1',
      );
    });
  });
});

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
