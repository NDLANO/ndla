/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ErrorLike } from "@apollo/client";
import {
  ErrorMessageDescription,
  ErrorMessageRoot,
  ErrorMessageContent,
  ErrorMessageTitle,
  ErrorMessageActions,
} from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Status } from "../components/Status";
import { SKIP_TO_CONTENT_ID } from "../constants";
import { AccessDeniedPage } from "../containers/AccessDeniedPage/AccessDeniedPage";
import { NotFoundPage } from "../containers/NotFoundPage/NotFoundPage";
import { UnpublishedResourcePage } from "../containers/UnpublishedResourcePage/UnpublishedResourcePage";
import { INTERNAL_SERVER_ERROR } from "../statusCodes";
import { NDLAError } from "../util/error/NDLAError";
import { handleError, hasAccessDeniedStatus, hasGoneStatus, hasNotFoundStatus } from "../util/handleError";
import { useRawLocation } from "../util/localePath";
import { log } from "../util/logger/logger";
import { ErrorNotice, ErrorNoticeMain } from "./ErrorNotice";
import { PageTitle } from "./PageTitle";

interface MessageRootProps {
  applySkipToContentId?: boolean;
  statusCode?: number;
}

export const DefaultErrorMessage = ({ applySkipToContentId, statusCode = 500 }: MessageRootProps) => {
  const { t } = useTranslation();

  return (
    <Status code={statusCode}>
      <ErrorMessageRoot>
        <img src={"/static/oops.gif"} alt={t("errorMessage.title")} />
        <ErrorMessageContent>
          <ErrorMessageTitle id={applySkipToContentId ? SKIP_TO_CONTENT_ID : undefined}>
            {t("errorMessage.title")}
          </ErrorMessageTitle>
          <ErrorMessageDescription>{t("errorMessage.description")}</ErrorMessageDescription>
        </ErrorMessageContent>
        <ErrorMessageActions>
          <SafeLink to="/">{t("errorMessage.goToFrontPage")}</SafeLink>
        </ErrorMessageActions>
      </ErrorMessageRoot>
    </Status>
  );
};

export const InternalServerError = ({ applySkipToContentId }: MessageRootProps) => (
  <Status code={INTERNAL_SERVER_ERROR}>
    <ErrorNotice statusCode={INTERNAL_SERVER_ERROR} applySkipToContentId={applySkipToContentId} />
  </Status>
);

type ErrorPageKind = "gone" | "accessDenied" | "notFound" | "internal";

const getErrorPageKind = (error: ErrorLike): ErrorPageKind => {
  if (hasGoneStatus(error)) return "gone";
  if (hasAccessDeniedStatus(error)) return "accessDenied";
  if (hasNotFoundStatus(error)) return "notFound";
  return "internal";
};

const logErrorPage = (error: ErrorLike, kind: ErrorPageKind) => {
  const pageError = new NDLAError(`DefaultErrorMessagePage rendered ${kind} page`, { cause: error });
  // Errors that are not NDLAErrors come from Apollo queries, and the ErrorLink in createApolloLinks has already reported them
  if (kind === "internal" && error instanceof NDLAError) {
    pageError.logLevel = error.logLevel;
    handleError(pageError);
  } else {
    log.info(pageError);
  }
};

const useLogErrorPage = (error: ErrorLike, kind: ErrorPageKind) => {
  const { pathname } = useRawLocation();
  const loggedKeyRef = useRef<string>(undefined);
  if (import.meta.env.SSR) {
    logErrorPage(error, kind);
  }
  useEffect(() => {
    // Callers may construct a new error on every render, so dedupe on content rather than identity
    const key = `${kind}:${error.message}:${pathname}`;
    if (loggedKeyRef.current === key) return;
    loggedKeyRef.current = key;
    logErrorPage(error, kind);
  }, [error, kind, pathname]);
};

interface DefaultErrorMessagePageProps {
  error: ErrorLike;
}

export const DefaultErrorMessagePage = ({ error }: DefaultErrorMessagePageProps) => {
  const { t } = useTranslation();
  const kind = getErrorPageKind(error);
  useLogErrorPage(error, kind);

  if (kind === "gone") return <UnpublishedResourcePage />;
  if (kind === "accessDenied") return <AccessDeniedPage />;
  if (kind === "notFound") return <NotFoundPage />;

  return (
    <ErrorNoticeMain>
      <PageTitle title={t("htmlTitles.errorPage")} useLocationForCustomPath={true} />
      <InternalServerError applySkipToContentId={true} />
    </ErrorNoticeMain>
  );
};
