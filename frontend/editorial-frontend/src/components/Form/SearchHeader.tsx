/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import type { SearchType } from "../../interfaces";

const StyledSearchHeader = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
});

interface Props {
  type: SearchType;
}

const SearchHeader = ({ type }: Props) => {
  const { t } = useTranslation();

  return (
    <StyledSearchHeader>
      <Heading textStyle="title.large">{t(`searchPage.header.${type}`)}</Heading>
    </StyledSearchHeader>
  );
};

export default SearchHeader;
