/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ErrorMessageDescription,
  ErrorMessageRoot,
  ErrorMessageContent,
  ErrorMessageTitle,
  ErrorMessageActions,
} from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { useTranslation } from "react-i18next";
import { Status } from "../components/Status";
import { SKIP_TO_CONTENT_ID } from "../constants";
import { INTERNAL_SERVER_ERROR } from "../statusCodes";
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

export const DefaultErrorMessagePage = () => {
  const { t } = useTranslation();
  return (
    <ErrorNoticeMain>
      <PageTitle title={t("htmlTitles.errorPage")} useLocationForCustomPath={true} />
      <InternalServerError applySkipToContentId={true} />
    </ErrorNoticeMain>
  );
};
