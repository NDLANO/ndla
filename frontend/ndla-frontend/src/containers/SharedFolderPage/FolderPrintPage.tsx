/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { skipToken, useSuspenseQuery } from "@apollo/client/react";
import { Button, Heading, MessageBox, PageContent, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { keyBy, NoSSR } from "@ndla/util";
import { Suspense, useContext, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { AuthContext } from "../../components/AuthenticationContext";
import { DefaultErrorMessagePage } from "../../components/DefaultErrorMessage";
import { PageRainbowSpinner } from "../../components/PageSpinner";
import { PageTitle } from "../../components/PageTitle";
import { RobotsMeta } from "../../components/RobotsMeta";
import { StepperIndicator, StepperList, StepperListItem, StepperRoot } from "../../components/Stepper";
import config from "../../config";
import { SKIP_TO_CONTENT_ID } from "../../constants";
import {
  foldersPageQuery,
  myNdlaResourceMetaSearchQuery,
  sharedFolderQueryDef,
  useFolder,
} from "../../mutations/folder/folderQueries";
import { formatDate, formatTime } from "../../util/formatDate";
import { hasNotFoundStatus } from "../../util/handleError";
import { getListItemTraits } from "../../util/listItemTraits";
import { useStableSearchParams } from "../../util/useStableSearchParams";
import { ResourceSortOption } from "../MyNdla/Folders/components/ResourceSortOption";
import { keyId, sortAndFilterResources } from "../MyNdla/Folders/util";
import { NotFoundPage } from "../NotFoundPage/NotFoundPage";
import { isPrintableResource, PrintResource, printResourceId, useTypesetQueue } from "./components/PrintResource";
import { type FolderWithResources, getAllResources } from "./folderPrintUtil";

const StyledMain = styled("main", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    paddingTop: "3xlarge",
    _print: {
      display: "block",
      paddingBlock: "10",
    },
  },
});

const PrintHeader = styled("header", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    padding: "xxlarge",
    backgroundColor: "primary",
    color: "white",
    _print: {
      printColorAdjust: "exact",
    },
  },
});

const StyledMessageBox = styled(MessageBox, {
  base: {
    _print: {
      printColorAdjust: "exact",
      breakInside: "avoid",
      marginBlockEnd: "medium",
    },
  },
});

const MetaImage = styled("img", {
  base: {
    width: "full",
    objectFit: "contain",
  },
});

const StyledListWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "10",
  },
});

const PrintButtonWrapper = styled("div", {
  base: {
    padding: "xxlarge",
    display: "flex",
    justifyContent: "center",
    _print: {
      display: "none",
    },
  },
});

const SortWrapper = styled("div", {
  base: {
    display: "flex",
    justifyContent: "flex-end",
    _print: {
      display: "none",
    },
  },
});

const StyledStepperList = styled(StepperList, {
  base: {
    gap: "xxsmall",
  },
});

const StyledItemWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxsmall",
  },
});

interface FolderIdProps {
  folderId: string;
}

// Rendered client side only, as we need to know whether the user is logged in to look up their own (possibly private) folders.
export const FolderPrintPage = () => (
  <NoSSR fallback={<PageRainbowSpinner />}>
    <Suspense fallback={<PageRainbowSpinner />}>
      <FolderPrintPageContent />
    </Suspense>
  </NoSSR>
);

const FolderPrintPageContent = () => {
  const { folderId = "" } = useParams();
  const { authenticated, authContextLoaded } = useContext(AuthContext);

  if (!authContextLoaded) {
    return <PageRainbowSpinner />;
  }

  return authenticated ? <OwnFolderPrint folderId={folderId} /> : <SharedFolderPrint folderId={folderId} />;
};

const OwnFolderPrint = ({ folderId }: FolderIdProps) => {
  // We load this to ensure all folders are in cache.
  useSuspenseQuery(foldersPageQuery);
  const folder = useFolder(folderId);

  // Folders owned by other users can still be printed if they are shared.
  return folder ? <FolderPrint folder={folder} /> : <SharedFolderPrint folderId={folderId} />;
};

const SharedFolderPrint = ({ folderId }: FolderIdProps) => {
  const { data, error } = useSuspenseQuery(sharedFolderQueryDef, { variables: { id: folderId } });

  if (hasNotFoundStatus(error)) {
    return <NotFoundPage />;
  }
  if (error || !data?.sharedFolder) {
    return <DefaultErrorMessagePage />;
  }

  return <FolderPrint folder={data.sharedFolder} />;
};

interface FolderPrintProps {
  folder: FolderWithResources & { name: string };
}

const FolderPrint = ({ folder }: FolderPrintProps) => {
  const { i18n, t } = useTranslation();
  const [params] = useStableSearchParams();
  const [renderedDate] = useState(() => new Date().toISOString());
  const typesetElement = useTypesetQueue();
  const allResources = useMemo(() => getAllResources(folder), [folder]);
  const printableResources = useMemo(() => allResources.filter(isPrintableResource), [allResources]);

  // Resource titles are needed to sort by name.
  const metaQuery = useSuspenseQuery(
    myNdlaResourceMetaSearchQuery,
    printableResources.length === 0
      ? skipToken
      : {
          variables: {
            resources: printableResources.map((res) => ({
              id: res.resourceId,
              path: res.path,
              resourceType: res.resourceType,
            })),
          },
        },
  );

  const metaData = metaQuery.data?.myNdlaResourceMetaSearch;
  const keyedData = useMemo(() => keyBy(metaData ?? [], (resource) => keyId(resource.type, resource.id)), [metaData]);
  const resources = useMemo(
    () => sortAndFilterResources(params, keyedData, printableResources),
    [keyedData, params, printableResources],
  );
  const metaImageUrl = resources
    .map((r) => keyedData[keyId(r.resourceType, r.resourceId)]?.metaImage?.url)
    .find((url) => !!url);

  const subtitle = useMemo(
    () =>
      t("folderPrintPage.subtitle", {
        date: formatDate(renderedDate, i18n.language),
        time: formatTime(renderedDate, i18n.language),
      }),
    [t, i18n, renderedDate],
  );

  const pageUrl = `${config.ndlaFrontendDomain}${location.pathname}`;

  const emailTemplate = useMemo(
    () =>
      `mailto:hjelp@ndla.no?subject=${t("folderPrintPage.emailSubject")}&body=${t("folderPrintPage.emailBody", { url: pageUrl, description: subtitle, interpolation: { escapeValue: false } })}`,
    [t, subtitle, pageUrl],
  );

  return (
    <>
      <PageTitle title={folder.name} useLocationForCustomPath={true} />
      <RobotsMeta />
      <PageContent variant="page">
        <PrintHeader>
          <Heading id={SKIP_TO_CONTENT_ID} textStyle="heading.large" asChild consumeCss>
            <h1>{folder.name}</h1>
          </Heading>
          <Text textStyle="label.medium">{subtitle}</Text>
        </PrintHeader>
        {metaImageUrl ? <MetaImage src={metaImageUrl} alt="" /> : undefined}
      </PageContent>
      <PageContent variant="content" asChild consumeCss>
        <StyledMain>
          <StyledMessageBox variant="warning">
            <Text>
              <Trans
                i18nKey="folderPrintPage.disclaimer"
                components={{
                  safelink: <SafeLink to={config.ndlaFrontendDomain} />,
                  a: <SafeLink to={emailTemplate} />,
                }}
              />
            </Text>
          </StyledMessageBox>
          <StyledMessageBox variant="success">{t("folderPrintPage.description")}</StyledMessageBox>
          <PrintButtonWrapper>
            <Button onClick={() => window.print()}>{t("folderPrintPage.printOrExport")}</Button>
          </PrintButtonWrapper>
          {resources.length > 1 && (
            <SortWrapper>
              <ResourceSortOption />
            </SortWrapper>
          )}
          <StyledListWrapper>
            <Text textStyle="body.large" fontWeight="bold">
              {t("folderPrintPage.content")}
            </Text>
            <Text textStyle="body.small">
              {t("folderPrintPage.contentSubtitle", { number: resources.length, folder: folder.name })}
            </Text>
            <StepperRoot line>
              <StyledStepperList>
                {resources.map((r, index) => {
                  const meta = keyedData[keyId(r.resourceType, r.resourceId)];
                  return (
                    <StepperListItem key={r.id}>
                      <StepperIndicator>{index + 1}</StepperIndicator>
                      <StyledItemWrapper>
                        <Text fontWeight="bold" textStyle="body.medium" color="text.default" asChild consumeCss>
                          <a href={`#${printResourceId(r)}`}>
                            {meta?.title || t("myNdla.sharedFolder.resourceRemovedTitle")}
                          </a>
                        </Text>
                        <Text textStyle="label.small" color="text.subtle">
                          {getListItemTraits(
                            {
                              resourceTypes: meta?.resourceTypes,
                              traits: meta?.__typename === "MyNdlaArticleResourceMeta" ? meta?.traits : undefined,
                            },
                            t,
                          ).join(", ")}
                        </Text>
                      </StyledItemWrapper>
                    </StepperListItem>
                  );
                })}
              </StyledStepperList>
            </StepperRoot>
          </StyledListWrapper>
          {resources.map((resource) => (
            <PrintResource key={resource.id} resource={resource} typesetElement={typesetElement} />
          ))}
        </StyledMain>
      </PageContent>
    </>
  );
};

export default FolderPrintPage;
