/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LoggerContext } from "@ndla/server";
import config from "../../config";

export const getLoggerContext = async (): Promise<LoggerContext | undefined> => {
  if (__IS_SSR_BUILD__ && !config.isClient) {
    const { getLoggerContextStore } = await import("@ndla/server");
    return getLoggerContextStore();
  }

  if (config.isClient) {
    return {
      requestPath: `${window.location.pathname}${window.location.search}`,
      correlationID: undefined,
    };
  }

  if (config.runtimeType === "test") return undefined;
  throw new Error("LoggerContext is not available in this environment");
};
