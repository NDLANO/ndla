/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createListCollection } from "@ark-ui/react/collection";
import { SelectContent, SelectLabel, SelectRoot, SelectValueText } from "@ndla/primitives";
import { css } from "@ndla/styled-system/css";
import { styled } from "@ndla/styled-system/jsx";
import { GenericSelectItem, GenericSelectTrigger } from "@ndla/ui";
import { type ComponentProps, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Pagination from "../../../../components/abstractions/Pagination";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";

const pageSizeOptions = ["5", "10", "20", "50", "100"];

const Footer = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "xsmall",
  },
});

const StyledSelectLabel = styled(SelectLabel, {
  base: {
    whiteSpace: "nowrap",
  },
});

const inlineSelectRootStyle = css.raw({
  flexDirection: "row",
  alignItems: "center",
});

const StyledGenericSelectTrigger = styled(GenericSelectTrigger, {
  base: {
    width: "surface.4xsmall",
  },
});

type Props = ComponentProps<typeof Pagination> & {
  defaultPageSize: number;
};

export const SearchPagination = ({ defaultPageSize, ...paginationProps }: Props) => {
  const { t } = useTranslation();
  const [params, setParams] = useStableSearchPageParams();

  const collection = useMemo(() => createListCollection({ items: pageSizeOptions }), []);

  return (
    <Footer>
      <Pagination {...paginationProps} />
      <SelectRoot
        collection={collection}
        value={[params.get("page-size") ?? defaultPageSize.toString()]}
        onValueChange={(details) => {
          const value = details.value[0];
          if (value) setParams({ "page-size": value === defaultPageSize.toString() ? null : value });
        }}
        positioning={{ sameWidth: true }}
        css={inlineSelectRootStyle}
      >
        <StyledSelectLabel textStyle="label.small">{t("searchPage.hitsSelectLabel")}</StyledSelectLabel>
        <StyledGenericSelectTrigger size="small">
          <SelectValueText />
        </StyledGenericSelectTrigger>
        <SelectContent>
          {collection.items.map((option) => (
            <GenericSelectItem item={option} key={option}>
              {option}
            </GenericSelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </Footer>
  );
};
