/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import type { ReactNode } from "react";
import SearchSaveButton, { type SearchSaveParams } from "../../../components/Form/SearchSaveButton";
import type { SearchType } from "../../../interfaces";
import { SearchFiltersToggle } from "./SearchLayout";

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
      <SearchSaveButton userData={userData} filters={filters} searchContentType={type} />
      <SearchFiltersToggle />
    </Actions>
  </Row>
);
