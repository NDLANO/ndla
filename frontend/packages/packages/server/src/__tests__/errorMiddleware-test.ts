/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer, type Server } from "node:http";
import type { Logger, LogLevel } from "@ndla/shared";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createErrorMiddleware, getErrorStatusCode } from "../errorMiddleware";

const createTestLogger = () => {
  const entries: { level: LogLevel; message: unknown }[] = [];
  const log = (level: LogLevel, message: unknown) => entries.push({ level, message });
  const logger: Logger = {
    log,
    info: (message) => log("info", message),
    warn: (message) => log("warn", message),
    error: (message) => log("error", message),
  };
  return { entries, logger };
};

describe("createErrorMiddleware", () => {
  let server: Server | undefined;

  afterEach(async () => {
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    server = undefined;
  });

  const request = async (error: unknown) => {
    const { entries, logger } = createTestLogger();
    const app = express();
    app.get("/", () => {
      throw error;
    });
    app.use(createErrorMiddleware(logger));
    server = createServer(app);
    await new Promise<void>((resolve) => server?.listen(0, () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : "";
    const res = await fetch(`http://localhost:${port}/`);
    return { res, body: await res.text(), entries };
  };

  it("logs unexpected errors and answers 500", async () => {
    const { res, body, entries } = await request(new Error("boom"));

    expect(res.status).toBe(500);
    expect(body).toBe("Internal Server Error");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ level: "error", message: { message: "boom", statusCode: 500 } });
  });

  it("answers with the status and headers of the error", async () => {
    const error = Object.assign(new Error("Unauthorized"), {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="api"' },
    });

    const { res, body, entries } = await request(error);

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe('Bearer realm="api"');
    expect(body).toBe("Unauthorized");
    expect(entries[0]).toMatchObject({ level: "info", message: { statusCode: 401 } });
  });
});

describe("getErrorStatusCode", () => {
  it("uses error statuses in the 4xx and 5xx range", () => {
    expect(getErrorStatusCode({ status: 404 })).toBe(404);
    expect(getErrorStatusCode({ status: 503 })).toBe(503);
  });

  it("falls back to 500", () => {
    expect(getErrorStatusCode(new Error("boom"))).toBe(500);
    expect(getErrorStatusCode({ status: 302 })).toBe(500);
    expect(getErrorStatusCode(undefined)).toBe(500);
  });
});
