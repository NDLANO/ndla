/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import type { ReactNode } from "react";
import { Trans } from "react-i18next";
import SearchSaveButton, { type SearchSaveParams } from "../../../components/Form/SearchSaveButton";
import type { SearchType } from "../../../interfaces";
import { SearchFiltersToggle } from "./SearchLayout";

export const SearchQueryStack = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const Row = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "xsmall",
  },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "4xsmall",
  },
});

interface SearchResultSummaryProps {
  totalCount: number | undefined;
  page: number | undefined;
  pageSize: number | undefined;
  query: string | null | undefined;
}

export const SearchResultSummary = ({ totalCount = 0, page = 1, pageSize = 0, query }: SearchResultSummaryProps) => {
  const from = totalCount ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, totalCount);
  return (
    <Text textStyle="label.small" data-testid="totalCount" aria-live="polite">
      <Trans
        i18nKey={query ? "searchPage.resultSummaryWithQuery" : "searchPage.resultSummary"}
        values={{ from, to, count: totalCount, query }}
        components={{ count: <span data-testid="searchTotalCount" /> }}
      />
    </Text>
  );
};

interface Props {
  type: SearchType;
  summary?: ReactNode;
  filters: SearchSaveParams;
  userData: UserDataDTO | undefined;
}

export const SearchSummaryRow = ({ type, summary, filters, userData }: Props) => (
  <Row>
    <div>{summary}</div>
    <Actions>
      <SearchSaveButton
        userData={userData}
        filters={filters}
        searchContentType={type}
        size="small"
        variant="tertiary"
      />
      <SearchFiltersToggle />
    </Actions>
  </Row>
);
