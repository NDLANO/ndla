/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createListCollection } from "@ark-ui/react/collection";
import { tDynamic } from "@ndla/locales";
import {
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupItemText,
  RadioGroupLabel,
  RadioGroupRoot,
  SelectContent,
  SelectLabel,
  SelectRoot,
  SelectValueText,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { GenericSelectItem, GenericSelectTrigger } from "@ndla/ui";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "xsmall",
  },
});

const StyledRadioGroupRoot = styled(RadioGroupRoot, {
  base: {
    gap: "xxsmall",
  },
});

const OptionsRow = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "small",
    rowGap: "xsmall",
    paddingBlock: "xxsmall",
  },
});

const StyledGenericSelectTrigger = styled(GenericSelectTrigger, {
  base: {
    width: "fit",
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

const DEFAULT_SORT_TYPES: SortType[] = ["id", "relevance", "title", "lastUpdated"];

const PRIMARY_SORT_LABELS: Record<string, "searchForm.bestMatch" | "searchForm.dateAsc" | "searchForm.dateDesc"> = {
  "-relevance": "searchForm.bestMatch",
  lastUpdated: "searchForm.dateAsc",
  "-lastUpdated": "searchForm.dateDesc",
};

const DEFAULT_PRIMARY = Object.keys(PRIMARY_SORT_LABELS);

const getSortLabel = (value: string, t: TFunction) => {
  const primaryLabel = PRIMARY_SORT_LABELS[value];
  if (primaryLabel) return t(primaryLabel);
  const descending = value.startsWith("-");
  const sortType = descending ? value.slice(1) : value;
  return `${tDynamic(t, `searchForm.sort.${sortType}`)} ${t(descending ? "searchForm.desc" : "searchForm.asc").toLowerCase()}`;
};

interface Props {
  sortTypes?: SortType[];
  primary?: string[];
  value: string;
  onValueChange: (value: string) => void;
}

const SearchSort = ({ sortTypes = DEFAULT_SORT_TYPES, primary = DEFAULT_PRIMARY, value, onValueChange }: Props) => {
  const { t } = useTranslation();

  const otherCollection = useMemo(
    () =>
      createListCollection({
        items: sortTypes.flatMap((type) => [type, `-${type}`]).filter((option) => !primary.includes(option)),
        itemToString: (item) => getSortLabel(item, t),
      }),
    [primary, sortTypes, t],
  );

  return (
    <Wrapper>
      <StyledRadioGroupRoot value={value} onValueChange={(details) => details.value && onValueChange(details.value)}>
        <RadioGroupLabel textStyle="label.small">{t("searchForm.sortBy")}</RadioGroupLabel>
        <OptionsRow>
          {primary.map((option) => (
            <RadioGroupItem key={option} value={option}>
              <RadioGroupItemControl />
              <RadioGroupItemText textStyle="label.small">{getSortLabel(option, t)}</RadioGroupItemText>
              <RadioGroupItemHiddenInput />
            </RadioGroupItem>
          ))}
        </OptionsRow>
      </StyledRadioGroupRoot>
      {!!otherCollection.items.length && (
        <SelectRoot
          collection={otherCollection}
          positioning={{ sameWidth: false, placement: "bottom-start" }}
          value={otherCollection.has(value) ? [value] : []}
          onValueChange={(details) => {
            const newValue = details.value[0];
            if (newValue) onValueChange(newValue);
          }}
        >
          <SelectLabel srOnly>{t("searchForm.otherSortOptions")}</SelectLabel>
          <StyledGenericSelectTrigger variant="tertiary" size="small">
            <SelectValueText placeholder={t("searchForm.otherSortOptions")} />
          </StyledGenericSelectTrigger>
          <SelectContent>
            {otherCollection.items.map((option) => (
              <GenericSelectItem item={option} key={option}>
                {getSortLabel(option, t)}
              </GenericSelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      )}
    </Wrapper>
  );
};

export default SearchSort;
