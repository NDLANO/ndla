/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isApiError } from "@ndla/api-client";
import { type ErrorEvent, type EventHint, init } from "@sentry/react";
import type { ConfigType } from "../config";

const INFORMATIONAL_STATUS_CODES = [401, 403, 404, 410];

const isInformationalError = (exception: unknown): boolean =>
  isApiError(exception) && INFORMATIONAL_STATUS_CODES.includes(exception.status);

type SentryIgnore = {
  error: string;
  exact?: boolean;
};

const sentryIgnoreErrors: SentryIgnore[] = [
  // Network problems
  { error: "[Network error]: Failed to fetch", exact: true },
  { error: "Failed to fetch", exact: true },
];

export const beforeSend = (event: ErrorEvent, hint: EventHint) => {
  const exception = hint.originalException;
  if (isInformationalError(exception)) return null;

  const message =
    event.message || event?.exception?.values?.[0]?.value || (hint?.originalException as Error | undefined)?.message;
  if (typeof message !== "string") return event;

  // Extension error filtering
  const frames = event?.exception?.values?.[0]?.stacktrace?.frames || [];
  const hasExtensionFrame = frames.some((frame) => {
    const filename = frame?.filename || "";
    return (
      filename.startsWith("chrome-extension://") ||
      filename.startsWith("moz-extension://") ||
      filename.includes("extensions::")
    );
  });

  const isExtensionError =
    hasExtensionFrame || message.includes("chrome-extension://") || message.includes("moz-extension://");

  if (isExtensionError) return null;

  const ignoreEntry = sentryIgnoreErrors.find((ignoreEntry) => {
    if (ignoreEntry.exact) {
      return message === ignoreEntry.error;
    }
    return message.includes(ignoreEntry.error);
  });

  if (ignoreEntry) {
    return null;
  }

  return event;
};

export const initSentry = (config: ConfigType) => {
  if (config.ndlaEnvironment === "local" || config.ndlaEnvironment === "dev") {
    // Skipping sentry initialization in local and dev environments
    return;
  }

  if (!config.sentrydsn) return;

  const release = `${config.componentName}@${config.componentVersion}`;

  init({
    dsn: config.sentrydsn,
    environment: config.ndlaEnvironment,
    normalizeDepth: 20,
    release,
    beforeSend,
    integrations: [],
  });
};
