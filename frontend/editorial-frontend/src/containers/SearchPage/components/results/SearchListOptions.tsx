/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  totalCount?: number;
  children?: ReactNode;
}

const SearchListOptionsWrapper = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "xsmall",
    paddingBlockStart: "xsmall",
  },
});

const SearchListOptions = ({ totalCount, children }: Props) => {
  const { t } = useTranslation();

  return (
    <SearchListOptionsWrapper>
      <Text data-testid="totalCount">
        {t("searchPage.totalCount")}: <b data-testid="searchTotalCount">{totalCount}</b>
      </Text>
      {children}
    </SearchListOptionsWrapper>
  );
};

export default SearchListOptions;
