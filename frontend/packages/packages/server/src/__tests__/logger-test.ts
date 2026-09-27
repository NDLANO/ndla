/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Writable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import winston from "winston";
import { createLogger } from "../logger";
import { withLoggerContext } from "../loggerContextMiddleware";

const setup = (options: { json?: boolean; level?: string } = {}) => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  const logger = createLogger({
    service: "test",
    json: options.json ?? true,
    level: options.level,
    transports: [new winston.transports.Stream({ stream })],
  });
  const waitForEntries = async (count: number) => {
    await vi.waitFor(() => expect(lines).toHaveLength(count));
    return lines.map((line) => JSON.parse(line));
  };
  return { logger, lines, waitForEntries };
};

describe("createLogger", () => {
  it("adds service and logger context", async () => {
    const { logger, waitForEntries } = setup();

    withLoggerContext({ correlationID: "correlation-id", requestPath: "/path" }, () => logger.info("hello"));

    const [entry] = await waitForEntries(1);
    expect(entry).toMatchObject({
      level: "info",
      message: "hello",
      service: "test",
      correlationID: "correlation-id",
      requestPath: "/path",
    });
    expect(entry.timestamp).toEqual(expect.any(String));
  });

  it("serialises an error passed as meta", async () => {
    const { logger, waitForEntries } = setup();

    logger.error("Something failed", new Error("boom", { cause: new Error("root cause") }), { url: "/x" });

    const [entry] = await waitForEntries(1);
    expect(entry).toMatchObject({
      level: "error",
      message: "Something failed",
      name: "Error",
      cause: { message: "root cause" },
      logMeta: { url: "/x" },
    });
    expect(entry.stack).toContain("boom");
  });

  it("serialises an error passed as the message", async () => {
    const { logger, waitForEntries } = setup();

    logger.warn(Object.assign(new Error("not found"), { status: 404 }));

    const [entry] = await waitForEntries(1);
    expect(entry).toMatchObject({ level: "warn", message: "not found", statusCode: 404 });
  });

  it("logs objects as the entry", async () => {
    const { logger, waitForEntries } = setup();

    logger.log("warn", { message: "hi", extra: 1 });

    const [entry] = await waitForEntries(1);
    expect(entry).toMatchObject({ level: "warn", message: "hi", extra: 1 });
  });

  it("skips entries below the configured level", async () => {
    const { logger, waitForEntries } = setup({ level: "warn" });

    logger.info("hidden");
    logger.warn("shown");

    const entries = await waitForEntries(1);
    expect(entries.map((e) => e.message)).toEqual(["shown"]);
  });

  it("prints a readable line when not logging json", async () => {
    const { logger, lines } = setup({ json: false });

    withLoggerContext({ correlationID: "correlation-id", requestPath: "/path" }, () =>
      logger.info("hello", { extra: 1 }),
    );

    await vi.waitFor(() => expect(lines).toHaveLength(1));
    expect(lines[0]).toContain("/path: hello");
    expect(lines[0]).toContain('"extra": 1');
    expect(lines[0]).not.toContain("correlation-id");
  });
});
