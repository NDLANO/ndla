/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type ReactNode, useState } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import config from "./config";
import { ErrorPage, ErrorPageLayout } from "./containers/ErrorPage/ErrorPage";
import { NotFound } from "./containers/NotFoundPage/NotFoundPage";
import { NOT_FOUND } from "./statusCodes";
import { ensureError, handleError } from "./util/handleError";
import { hadChunkReloadAttempt, isChunkLoadError, triggerCrashReload } from "./util/skewDetection";

interface Props {
  children?: ReactNode;
}

export const ErrorElement = ({ children }: Props) => {
  const error = useRouteError();
  const isChunk = isChunkLoadError(error);
  const [hadAttempt] = useState(() => isChunk && hadChunkReloadAttempt());

  // If React Router for some reason doesn't match a route, we want to return 404 instead
  if (!children && isRouteErrorResponse(error) && error.status === NOT_FOUND) {
    return (
      <ErrorPageLayout>
        <NotFound applySkipToContentId={true} />
      </ErrorPageLayout>
    );
  }

  // Client errors, like a POST to a route without an action, keep their status and aren't reported as app failures
  if (isRouteErrorResponse(error) && error.status >= 400 && error.status < 500) {
    return children ?? <ErrorPage statusCode={error.status} />;
  }

  if (isChunk) {
    if (hadAttempt) {
      if (config.runtimeType === "production") handleError(ensureError(error));
    } else {
      triggerCrashReload();
      return null;
    }
  } else if (config.runtimeType === "production") {
    handleError(ensureError(error));
  }

  return children ?? <ErrorPage />;
};
