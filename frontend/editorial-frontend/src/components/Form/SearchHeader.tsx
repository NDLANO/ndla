/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SearchType } from "../../interfaces";
import SearchSaveButton, { type SearchSaveParams } from "./SearchSaveButton";

const StyledSearchHeader = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    alignItems: "flex-start",
  },
});

interface Props {
  type: SearchType;
  filters?: SearchSaveParams;
  userData: UserDataDTO | undefined;
  children?: ReactNode;
}

const SearchHeader = ({ type, filters, userData, children }: Props) => {
  const { t } = useTranslation();

  return (
    <StyledSearchHeader>
      <Heading textStyle="title.large">{t(`searchPage.header.${type}`)}</Heading>
      <Actions>
        {children}
        {!!filters && <SearchSaveButton userData={userData} filters={filters} searchContentType={type} />}
      </Actions>
    </StyledSearchHeader>
  );
};

export default SearchHeader;
