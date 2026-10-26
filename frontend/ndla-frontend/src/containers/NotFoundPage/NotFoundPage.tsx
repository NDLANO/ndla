/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTranslation } from "react-i18next";
import { ErrorNotice, ErrorNoticeMain } from "../../components/ErrorNotice";
import { PageTitle } from "../../components/PageTitle";
import { Status } from "../../components/Status";
import { NOT_FOUND } from "../../statusCodes";

interface NotFoundProps {
  applySkipToContentId?: boolean;
}

export const NotFound = ({ applySkipToContentId }: NotFoundProps) => {
  const { t } = useTranslation();
  return (
    <Status code={NOT_FOUND}>
      <PageTitle title={t("htmlTitles.notFound")} useLocationForCustomPath={true} />
      <ErrorNotice statusCode={NOT_FOUND} applySkipToContentId={applySkipToContentId} />
    </Status>
  );
};

export const NotFoundPage = () => {
  return (
    <ErrorNoticeMain>
      <NotFound applySkipToContentId={true} />
    </ErrorNoticeMain>
  );
};

export default NotFoundPage;
