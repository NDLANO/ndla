/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Agent } from "undici";
import config, { getEnvironmentVariabel } from "../config";
import log from "./logger";

const internalGatewayHost = getEnvironmentVariabel("API_GATEWAY_HOST");
const ndlaApiUrl = internalGatewayHost ? `http://${internalGatewayHost}` : config.ndlaApiUrl;

const MIGRATE_GREPS_PATH = "/draft-api/v1/drafts/migrate-greps";

const noResponseTimeoutDispatcher = new Agent({ headersTimeout: 0, bodyTimeout: 0 });

let inFlight = false;

const runMigration = async (url: URL, authorization: string): Promise<void> => {
  try {
    const init = {
      method: "POST",
      headers: { Authorization: authorization },
      dispatcher: noResponseTimeoutDispatcher,
    };
    const response = await fetch(url, init);

    if (response.ok) {
      log.info("Grep code migration finished successfully", { status: response.status });
    } else {
      log.error("Grep code migration failed", { status: response.status, body: await response.text() });
    }
  } catch (err) {
    log.error("Grep code migration failed", err);
  }
};

export const startGrepMigration = (authorization: string, startedBy: string | undefined): boolean => {
  if (inFlight) return false;

  const url = new URL(MIGRATE_GREPS_PATH, ndlaApiUrl);
  inFlight = true;
  log.info("Grep code migration started", { startedBy });

  runMigration(url, authorization).finally(() => {
    inFlight = false;
  });

  return true;
};
