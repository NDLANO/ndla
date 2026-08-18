/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { activeRequestsMiddleware, getActiveRequests, waitForActiveRequests } from "../activeRequestsMiddleware";

describe("activeRequestsMiddleware", () => {
  it("tracks active requests until the response finishes", () => {
    const res = new EventEmitter();
    const next = vi.fn();

    activeRequestsMiddleware({} as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(getActiveRequests()).toBe(1);

    res.emit("finish");

    expect(getActiveRequests()).toBe(0);
  });

  it("tracks active requests until the response closes", () => {
    const res = new EventEmitter();

    activeRequestsMiddleware({} as never, res as never, vi.fn());
    res.emit("close");

    expect(getActiveRequests()).toBe(0);
  });

  it("does not count finish and close twice", () => {
    const res = new EventEmitter();

    activeRequestsMiddleware({} as never, res as never, vi.fn());
    res.emit("finish");
    res.emit("close");

    expect(getActiveRequests()).toBe(0);
  });
});

describe("waitForActiveRequests", () => {
  it("waits until active requests finish", async () => {
    const info = vi.fn();
    const warn = vi.fn();
    const getActiveRequests = vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(1).mockReturnValue(0);

    await waitForActiveRequests({ getActiveRequests, info, warn, pollInterval: 0 });

    expect(info).toHaveBeenCalledWith("Waiting for 1 active requests to finish...");
    expect(info).toHaveBeenCalledWith("All active requests have finished processing.");
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns and gives up once the timeout is reached", async () => {
    const info = vi.fn();
    const warn = vi.fn();
    const getActiveRequests = vi.fn().mockReturnValue(2);

    await waitForActiveRequests({ getActiveRequests, info, warn, pollInterval: 0, timeout: 5 });

    expect(warn).toHaveBeenCalledWith(
      "Timeout reached while waiting for active requests to finish. Active requests: 2",
    );
    expect(info).not.toHaveBeenCalledWith("All active requests have finished processing.");
  });
});
