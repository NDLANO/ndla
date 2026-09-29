/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type ReactNode, useRef } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import config from "./config";
import { ErrorPage, ErrorPageLayout } from "./containers/ErrorPage/ErrorPage";
import { NotFound } from "./containers/NotFoundPage/NotFoundPage";
import { NOT_FOUND } from "./statusCodes";
import { handleError } from "./util/handleError";
import { hadChunkReloadAttempt, isChunkLoadError, triggerCrashReload } from "./util/skewDetection";

interface Props {
  children?: ReactNode;
}

export const ErrorElement = ({ children }: Props) => {
  const error = useRouteError();
  const isChunk = isChunkLoadError(error);
  const hadAttempt = useRef(isChunk && hadChunkReloadAttempt()).current;

  // If React Router for some reason doesn't match a route, we want to return 404 instead
  if (!children && isRouteErrorResponse(error) && error.status === NOT_FOUND) {
    return (
      <ErrorPageLayout>
        <NotFound applySkipToContentId={true} />
      </ErrorPageLayout>
    );
  }

  if (isChunk) {
    if (hadAttempt) {
      if (config.runtimeType === "production") handleError(error as Error);
    } else {
      triggerCrashReload();
      return null;
    }
  } else if (config.runtimeType === "production") {
    handleError(error as Error);
  }

  return children ?? <ErrorPage />;
};
