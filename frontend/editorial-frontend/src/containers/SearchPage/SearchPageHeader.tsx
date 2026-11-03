/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ListCheck, SearchContent, SearchMedia, VoiceprintLine } from "@ndla/icons";
import { PageContent } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import type { ParseKeys } from "i18next";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import type { SearchType } from "../../interfaces";
import { useBasePathname } from "../../util/localePath";
import { toSearch } from "../../util/routeHelpers";
import PrivateRoute from "../PrivateRoute/PrivateRoute";

const StyledList = styled("ul", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    listStyle: "none",
    gap: "3xsmall",
  },
});

const StyledPageContent = styled(PageContent, {
  base: {
    paddingBlock: "small",
  },
});

interface SearchObject {
  type: SearchType;
  title: ParseKeys;
  url: string;
  icon: ReactNode;
}

const searchTypes: SearchObject[] = [
  {
    type: "content",
    title: "subNavigation.searchContent",
    url: toSearch("content"),
    icon: <SearchContent />,
  },
  {
    type: "audio",
    title: "subNavigation.searchAudio",
    url: toSearch("audio"),
    icon: <VoiceprintLine />,
  },
  {
    type: "image",
    title: "subNavigation.searchImage",
    url: toSearch("image"),
    icon: <SearchMedia />,
  },
  {
    type: "podcast-series",
    title: "subNavigation.searchPodcastSeries",
    url: toSearch("podcast-series"),
    icon: <ListCheck />,
  },
];

const Component = () => <PrivateRoute component={<SearchPageHeader />} />;

export const SearchPageHeader = () => {
  const pathname = useBasePathname();
  const { t } = useTranslation();
  return (
    <>
      <StyledPageContent variant="page" asChild consumeCss aria-label={t("searchForm.searchTypes")}>
        <nav>
          <StyledList>
            {searchTypes.map((type) => {
              const currentPage = type.url.startsWith(pathname);
              return (
                <li key={type.type}>
                  <SafeLinkButton
                    to={type.url}
                    size="small"
                    variant={currentPage ? "primary" : "secondary"}
                    aria-current={currentPage}
                  >
                    {type.icon}
                    {t(type.title)}
                  </SafeLinkButton>
                </li>
              );
            })}
          </StyledList>
        </nav>
      </StyledPageContent>
      <Outlet />
    </>
  );
};

export default Component;
