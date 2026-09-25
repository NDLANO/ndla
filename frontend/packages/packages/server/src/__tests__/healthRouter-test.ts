/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer, type Server } from "node:http";
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const okBody = { status: 200, text: "Health check ok" };

describe("healthRouter", () => {
  let health: typeof import("../healthRouter");
  let server: Server;
  let url: string;

  beforeEach(async () => {
    vi.resetModules();
    health = await import("../healthRouter");
    const app = express();
    app.use(health.healthRouter);
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const address = server.address();
    url = `http://localhost:${typeof address === "object" && address !== null ? address.port : ""}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const get = async (path: string) => {
    const res = await fetch(`${url}${path}`);
    return { status: res.status, body: await res.json() };
  };

  it("answers liveness and readiness", async () => {
    expect(await get("/health")).toEqual({ status: 200, body: okBody });
    expect(await get("/health/liveness")).toEqual({ status: 200, body: okBody });
    expect(await get("/health/readiness")).toEqual({ status: 200, body: okBody });
  });
});
