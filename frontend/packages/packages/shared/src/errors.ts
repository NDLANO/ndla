/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LogLevel } from "./logLevel";

export class NDLAError extends Error {
  logLevel: LogLevel = "error";
  logContext: Record<string, unknown> = {};
}

export class StatusError extends NDLAError {
  status: number | undefined;
  json: unknown | undefined;
  constructor(message: string, status: number, json?: unknown) {
    super(message);
    this.status = status;
    this.json = json;
  }
}

export class NotFoundError extends StatusError {
  logLevel: LogLevel = "info";
  constructor(message: string) {
    super(message, 404);
  }
}

export const isStatusError = (error: unknown): error is StatusError => error instanceof StatusError;
