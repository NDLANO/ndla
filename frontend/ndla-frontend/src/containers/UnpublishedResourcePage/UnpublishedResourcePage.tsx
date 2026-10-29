/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTranslation } from "react-i18next";
import { ErrorNotice, ErrorNoticeMain } from "../../components/ErrorNotice";
import { PageTitle } from "../../components/PageTitle";
import { Status } from "../../components/Status";
import { GONE } from "../../statusCodes";

export const UnpublishedResourcePage = () => {
  const { t } = useTranslation();
  return (
    <Status code={GONE}>
      <ErrorNoticeMain>
        <PageTitle title={t("htmlTitles.unpublished")} useLocationForCustomPath={true} />
        <ErrorNotice statusCode={GONE} applySkipToContentId={true} />
      </ErrorNoticeMain>
    </Status>
  );
};
