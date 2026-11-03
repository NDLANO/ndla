/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createListCollection } from "@ark-ui/react/collection";
import { ArrowRightLine } from "@ndla/icons";
import { IconButton, SelectContent, SelectLabel, SelectRoot, SelectValueText } from "@ndla/primitives";
import { css } from "@ndla/styled-system/css";
import { styled } from "@ndla/styled-system/jsx";
import { GenericSelectItem, GenericSelectTrigger } from "@ndla/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const StyledSortContainer = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    alignItems: "center",
  },
});

const inlineSelectRootStyle = css.raw({
  flexDirection: "row",
  alignItems: "center",
});

const OrderIcon = styled(ArrowRightLine, {
  base: {
    transform: "rotate(-90deg)",
  },
  variants: {
    order: {
      desc: {
        transform: "rotate(90deg)",
      },
      asc: {},
    },
  },
});

const StyledGenericSelectTrigger = styled(GenericSelectTrigger, {
  base: {
    width: "surface.xxsmall",
    whiteSpace: "nowrap",
  },
});

export type SortType =
  | "id"
  | "relevance"
  | "title"
  | "lastUpdated"
  | "firstPublished"
  | "revisionDate"
  | "favorited"
  | "published"
  | "width"
  | "height";

interface Props {
  sortTypes?: SortType[];
  value: string;
  onValueChange: (value: string) => void;
}

const DEFAULT_SORT_TYPES: SortType[] = ["id", "relevance", "title", "lastUpdated"];

const SearchSort = ({ sortTypes = DEFAULT_SORT_TYPES, value, onValueChange }: Props) => {
  const { t } = useTranslation();

  const [sort, order] = useMemo(() => {
    const split = value.split("-");
    return split.length > 1 ? [split[1] ?? "", "desc"] : [split[0] ?? "", "asc"];
  }, [value]);

  const handleSortChange = (value: string) => {
    const _order = order === "desc" ? "-" : "";
    onValueChange(_order + value);
  };

  const toggleOrder = () => {
    const newOrder = order === "desc" ? "" : "-";
    onValueChange(newOrder + sort);
  };

  const orderLabel = `${t("searchForm.order")}: ${t(order === "desc" ? "searchForm.desc" : "searchForm.asc")}`;

  const sortCollection = useMemo(() => {
    return createListCollection({
      items: sortTypes,
      itemToString: (item) => t(`searchForm.sort.${item}`),
    });
  }, [sortTypes, t]);

  return (
    <StyledSortContainer>
      <SelectRoot
        collection={sortCollection}
        positioning={{ sameWidth: true }}
        css={inlineSelectRootStyle}
        value={[sort]}
        onValueChange={(details) => {
          const value = details.value[0];
          if (value) handleSortChange(value);
        }}
      >
        <SelectLabel>{t("searchForm.sorting")}</SelectLabel>
        <StyledGenericSelectTrigger>
          <SelectValueText />
        </StyledGenericSelectTrigger>
        <SelectContent>
          {sortCollection.items.map((option) => (
            <GenericSelectItem item={option} key={option}>
              {t(`searchForm.sort.${option}`)}
            </GenericSelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      <IconButton variant="secondary" aria-label={orderLabel} title={orderLabel} onClick={toggleOrder}>
        <OrderIcon order={order === "desc" ? "desc" : "asc"} />
      </IconButton>
    </StyledSortContainer>
  );
};

export default SearchSort;
