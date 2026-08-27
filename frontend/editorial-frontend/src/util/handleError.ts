/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { captureException, setContext } from "@sentry/react";
import config from "../config";

const sendToSentry = (error: any, rest: any[]) => {
  setContext("NDLA Context", {
    error,
    requestPath: `${window.location.pathname}${window.location.search}`,
    ...(rest.length ? { additionalInfo: rest } : {}),
  });
  captureException(error);
};

const handleError = (error: any, ...rest: any[]) => {
  if (config.runtimeType === "production") {
    sendToSentry(error, rest);
    // No logging when unit testing
  } else if (config.runtimeType !== "test") {
    console.error(error, ...rest); // eslint-disable-line no-console
  }
};
export default handleError;
