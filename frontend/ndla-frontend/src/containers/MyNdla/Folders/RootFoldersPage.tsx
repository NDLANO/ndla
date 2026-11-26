/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Heading } from "@ndla/primitives";
import { Suspense, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../components/AuthenticationContext";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import type {
  GQLFolderFragment,
  GQLRootFoldersPageQuery,
  GQLRootFoldersPageQueryVariables,
} from "../../../graphqlTypes";
import {
  folderFragment,
  myNdlaResourceFragment,
  sharedFolderFragment,
} from "../../../mutations/folder/folderFragments";
import { useStableSearchParams } from "../../../util/useStableSearchParams";
import { MyNdlaPageSection } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { PageActions } from "../components/PageActions";
import { SortSelect, type SortOption } from "../components/SortSelect";
import { useFolderActions } from "./components/FolderActionHooks";
import { FolderList } from "./components/FolderList";
import { ResourceList } from "./components/ResourceList";
import {
  FOLDERS_HEADING_ID,
  parseSharedFolderSort,
  RESOURCES_HEADING_ID,
  SHARED_FOLDERS_HEADING_ID,
  SORT_FIRST_ADDED,
  SORT_LAST_ADDED,
  type SharedFolderSort,
} from "./util";

const rootFoldersPageQuery: TypedDocumentNode<GQLRootFoldersPageQuery, GQLRootFoldersPageQueryVariables> = gql`
  query rootFoldersPage {
    folders(includeSubfolders: true, includeResources: true) {
      folders {
        ...Folder
      }
      sharedFolders {
        ...SharedFolder
      }
    }
    myNdlaRootResources {
      ...MyNdlaResource
    }
  }
  ${folderFragment}
  ${sharedFolderFragment}
  ${myNdlaResourceFragment}
`;

const RootFoldersPage = () => (
  <Suspense fallback={<PageRainbowSpinner />}>
    <RootFoldersPageContent />
  </Suspense>
);

const RootFoldersPageContent = () => {
  const { t } = useTranslation();
  const { examLock } = useContext(AuthContext);

  const pageQuery = useSuspenseQuery(rootFoldersPageQuery);

  const menuItems = useFolderActions(null, undefined, true);

  const [searchParams, setSearchParams] = useStableSearchParams();
  const sharedFolderSort = parseSharedFolderSort(searchParams.get("sharedSort"));

  // Shared folders are returned in the order they were saved
  const sharedFolders = pageQuery.data?.folders.sharedFolders ?? [];
  const sortedSharedFolders = sharedFolderSort === SORT_LAST_ADDED ? sharedFolders.toReversed() : sharedFolders;

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.myFavoritesPage")} useLocationForCustomPath={true} />
      <MyNdlaTitle title={t("myNdla.myFavorites")} />
      <MyNdlaPageSection>
        <Heading asChild consumeCss textStyle="heading.small" id={FOLDERS_HEADING_ID} tabIndex={-1}>
          <h2>{t("myNdla.folder.folders")}</h2>
        </Heading>
        {!examLock && <PageActions actions={menuItems} />}
        <FolderList
          labelledBy={FOLDERS_HEADING_ID}
          folders={(pageQuery.data?.folders.folders ?? []) as GQLFolderFragment[]}
        />
      </MyNdlaPageSection>
      <MyNdlaPageSection>
        <Heading asChild consumeCss textStyle="heading.small" id={RESOURCES_HEADING_ID} tabIndex={-1}>
          <h2>{t("myNdla.folder.resources")}</h2>
        </Heading>
        <ResourceList
          selectedFolder={undefined}
          resources={pageQuery.data?.myNdlaRootResources ?? []}
          labelledBy={RESOURCES_HEADING_ID}
        />
      </MyNdlaPageSection>
      <MyNdlaPageSection>
        <Heading asChild consumeCss textStyle="heading.small" id={SHARED_FOLDERS_HEADING_ID} tabIndex={-1}>
          <h2>{t("myNdla.sharedByOthersFolders")}</h2>
        </Heading>
        {!!sharedFolders.length && (
          <SharedFolderSortSelect
            value={sharedFolderSort}
            onValueChange={(value) =>
              setSearchParams({ sharedSort: value === SORT_LAST_ADDED ? null : value }, { preventScrollReset: true })
            }
          />
        )}
        <FolderList
          labelledBy={SHARED_FOLDERS_HEADING_ID}
          folders={sortedSharedFolders as unknown as GQLFolderFragment[]}
          isFavorited
        />
      </MyNdlaPageSection>
    </MyNdlaPageWrapper>
  );
};

interface SharedFolderSortSelectProps {
  value: SharedFolderSort;
  onValueChange: (value: SharedFolderSort) => void;
}

const SharedFolderSortSelect = ({ value, onValueChange }: SharedFolderSortSelectProps) => {
  const { t } = useTranslation();

  const options: SortOption<SharedFolderSort>[] = useMemo(
    () => [
      { value: SORT_LAST_ADDED, label: t("myNdla.sort.lastAdded") },
      { value: SORT_FIRST_ADDED, label: t("myNdla.sort.firstAdded") },
    ],
    [t],
  );

  return <SortSelect value={value} options={options} onValueChange={onValueChange} />;
};

export default RootFoldersPage;
