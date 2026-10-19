/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { skipToken, useSuspenseQuery } from "@apollo/client/react";
import { Heading, MessageBox, PageContent, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { keyBy, NoSSR } from "@ndla/util";
import { Suspense, useContext, useEffect, useMemo, useState } from "react";
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
import type { GQLMyNdlaResourceFragment } from "../../graphqlTypes";
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
import { NumberBadge } from "../MyNdla/components/NumberBadge";
import { ResourceSortOption } from "../MyNdla/Folders/components/ResourceSortOption";
import { keyId, sortAndFilterResources } from "../MyNdla/Folders/util";
import { NotFoundPage } from "../NotFoundPage/NotFoundPage";
import { isPrintableResource, PrintResource } from "./components/PrintResource";

const StyledMain = styled("main", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxlarge",
    _print: {
      display: "block",
      paddingBlock: "0",
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
  },
});

const StyledMessageBox = styled(MessageBox, {
  base: {
    display: "inline",
  },
});

const StyledListWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "10",
  },
});

const StyledOl = styled("ol", {
  base: {
    gap: "medium",
  },
});

const StyledLi = styled("li", {
  base: {
    display: "flex",
    flexDirection: "row",
    gap: "small",
    padding: "xxsmall",
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

interface FolderWithResources {
  resources: GQLMyNdlaResourceFragment[];
  subfolders?: FolderWithResources[];
}

const collectResources = (folder: FolderWithResources): GQLMyNdlaResourceFragment[] => [
  ...folder.resources,
  ...(folder.subfolders ?? []).flatMap(collectResources),
];

// Includes resources in all subfolders. A resource can be saved in several folders, so we only keep the first occurrence.
const getAllResources = (folder: FolderWithResources) => {
  const resources = new Map<string, GQLMyNdlaResourceFragment>();
  collectResources(folder).forEach((resource) => {
    if (!resources.has(resource.id)) resources.set(resource.id, resource);
  });
  return Array.from(resources.values());
};

interface FolderPrintProps {
  folder: FolderWithResources & { name: string };
}

const FolderPrint = ({ folder }: FolderPrintProps) => {
  const { i18n, t } = useTranslation();
  const [params] = useStableSearchParams();
  const [renderedDate] = useState(() => new Date().toISOString());
  const allResources = useMemo(() => getAllResources(folder), [folder]);

  // Resource titles are needed to sort by name.
  const metaQuery = useSuspenseQuery(
    myNdlaResourceMetaSearchQuery,
    allResources.length === 0
      ? skipToken
      : {
          variables: {
            resources: allResources.map((res) => ({
              id: res.resourceId,
              path: res.path,
              resourceType: res.resourceType,
            })),
          },
        },
  );

  useEffect(() => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      try {
        window.MathJax.typesetPromise();
      } catch {
        // do nothing
      }
    }
  });

  const metaData = metaQuery.data?.myNdlaResourceMetaSearch;
  const metaImage = metaData?.find((m) => m.metaImage);
  const keyedData = keyBy(metaData ?? [], (resource) => keyId(resource.type, resource.id));
  const resources = useMemo(() => {
    return sortAndFilterResources(params, keyedData, allResources).filter(isPrintableResource);
  }, [metaData, params, allResources]);

  return (
    <>
      <PageTitle title={folder.name} useLocationForCustomPath={true} />
      <RobotsMeta />
      <PageContent variant="page">
        <PrintHeader>
          <Heading id={SKIP_TO_CONTENT_ID} textStyle="heading.large" asChild consumeCss>
            <h1>{folder.name}</h1>
          </Heading>
          <Text textStyle="label.medium">
            {t("folderPrintPage.subtitle", {
              date: formatDate(renderedDate, i18n.language),
              time: formatTime(renderedDate, i18n.language),
            })}
          </Text>
        </PrintHeader>
        <img src={metaImage?.metaImage?.url ?? ""} alt="" />
      </PageContent>
      <PageContent variant="content" asChild consumeCss>
        <StyledMain>
          <StyledMessageBox variant="warning">
            <Trans
              i18nKey="folderPrintPage.disclaimer"
              components={{
                safelink: <SafeLink to={config.ndlaFrontendDomain} />,
                a: <a href="mailto:hjelp@ndla.no" />,
              }}
            />
          </StyledMessageBox>
          <StyledMessageBox variant="success">{t("folderPrintPage.description")}</StyledMessageBox>
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
            <StyledOl>
              {resources.map((r, index) => {
                const meta = keyedData[keyId(r.resourceType, r.resourceId)];
                return (
                  <StyledLi>
                    <NumberBadge size="medium">{index + 1}</NumberBadge>
                    <Text>{meta?.title ?? ""}</Text>
                    <Text textStyle="label.small" color="text.subtle">
                      {getListItemTraits(
                        {
                          resourceTypes: meta?.resourceTypes,
                          traits: meta?.traits,
                        },
                        t,
                      ).join(", ")}
                    </Text>{" "}
                  </StyledLi>
                );
              })}
            </StyledOl>
          </StyledListWrapper>
          {resources.map((resource) => (
            <PrintResource key={resource.id} resource={resource} />
          ))}
        </StyledMain>
      </PageContent>
    </>
  );
};

export default FolderPrintPage;
