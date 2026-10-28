/**
 * Copyright (c) 2018-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NdlaLogoText } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ErrorNotice } from "../../components/ErrorNotice";
import { PageLayout } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/PageTitle";
import { Status } from "../../components/Status";
import { INTERNAL_SERVER_ERROR } from "../../statusCodes";
import { MastheadContainer } from "../Masthead/Masthead";
import { Footer } from "../Page/components/Footer";

interface ErrorPageLayoutProps {
  children: ReactNode;
}

export const ErrorPageLayout = ({ children }: ErrorPageLayoutProps) => (
  <>
    <MastheadContainer>
      <SafeLink to="/" aria-label="NDLA" title="NDLA">
        <NdlaLogoText />
      </SafeLink>
    </MastheadContainer>
    <PageLayout asChild consumeCss>
      <main>{children}</main>
    </PageLayout>
    <Footer />
  </>
);

interface ErrorPageProps {
  statusCode?: number;
}

export const ErrorPage = ({ statusCode = INTERNAL_SERVER_ERROR }: ErrorPageProps) => {
  const { t } = useTranslation();
  return (
    <Status code={statusCode}>
      <PageTitle title={t("htmlTitles.errorPage")} useLocationForCustomPath={true} />
      <meta name="description" content={t("meta.description")} />
      <ErrorPageLayout>
        <ErrorNotice statusCode={statusCode} applySkipToContentId />
      </ErrorPageLayout>
    </Status>
  );
};
