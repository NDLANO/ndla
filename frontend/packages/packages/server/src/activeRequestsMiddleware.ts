/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { RequestHandler } from "express";

interface ActiveRequestsMiddleware {
  middleware: RequestHandler;
  getActiveRequests: () => number;
}

const createActiveRequestsMiddleware = (): ActiveRequestsMiddleware => {
  let activeRequests = 0;

  return {
    middleware: (_req, res, next): void => {
      let requestFinished = false;
      const finishRequest = (): void => {
        if (requestFinished) return;
        requestFinished = true;
        activeRequests--;
      };

      activeRequests++;
      res.on("finish", finishRequest);
      res.on("close", finishRequest);
      next();
    },
    getActiveRequests: (): number => activeRequests,
  };
};

const defaultActiveRequests = createActiveRequestsMiddleware();

export const activeRequestsMiddleware = defaultActiveRequests.middleware;
export const getActiveRequests = defaultActiveRequests.getActiveRequests;

export interface WaitForActiveRequestsOptions {
  getActiveRequests?: () => number;
  info: (message: string) => void;
  warn: (message: string) => void;
  timeout?: number;
  pollInterval?: number;
}

export async function waitForActiveRequests({
  getActiveRequests = defaultActiveRequests.getActiveRequests,
  info,
  warn,
  timeout = 20_000,
  pollInterval = 250,
}: WaitForActiveRequestsOptions): Promise<void> {
  const start = Date.now();
  info(`Waiting for ${getActiveRequests()} active requests to finish...`);

  while (getActiveRequests() > 0 && Date.now() - start < timeout) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  const remaining = getActiveRequests();
  if (remaining > 0) {
    warn(`Timeout reached while waiting for active requests to finish. Active requests: ${remaining}`);
  } else {
    info("All active requests have finished processing.");
  }
}
