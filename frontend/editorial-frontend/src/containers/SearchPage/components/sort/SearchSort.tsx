/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowDownShortLine } from "@ndla/icons";
import { tDynamic } from "@ndla/locales";
import {
  Button,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupItemText,
  RadioGroupLabel,
  RadioGroupRoot,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { TFunction } from "i18next";
import { useId, useMemo, useState } from "react";
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
    _hidden: {
      display: "none",
    },
  },
});

const ToggleIcon = styled(ArrowDownShortLine, {
  base: {
    transitionProperty: "[transform]",
    transitionDuration: "normal",
    _motionReduce: {
      transition: "[none]",
    },
  },
  variants: {
    open: {
      true: {
        transform: "rotate(180deg)",
      },
    },
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
  const otherOptionsId = useId();

  const otherOptions = useMemo(
    () => sortTypes.flatMap((type) => [type, `-${type}`]).filter((option) => !primary.includes(option)),
    [primary, sortTypes],
  );

  const [showOther, setShowOther] = useState(() => otherOptions.includes(value));

  return (
    <Wrapper>
      <StyledRadioGroupRoot value={value} onValueChange={(details) => details.value && onValueChange(details.value)}>
        <RadioGroupLabel textStyle="label.small">{t("searchForm.sortBy")}</RadioGroupLabel>
        <OptionsRow>
          {primary.map((option) => (
            <SortOption key={option} value={option} label={getSortLabel(option, t)} />
          ))}
        </OptionsRow>
        <OptionsRow id={otherOptionsId} hidden={!showOther}>
          {otherOptions.map((option) => (
            <SortOption key={option} value={option} label={getSortLabel(option, t)} />
          ))}
        </OptionsRow>
      </StyledRadioGroupRoot>
      {!!otherOptions.length && (
        <Button
          variant="tertiary"
          size="small"
          aria-expanded={showOther}
          aria-controls={otherOptionsId}
          onClick={() => setShowOther((prev) => !prev)}
        >
          {t("searchForm.otherSortOptions")}
          <ToggleIcon open={showOther} />
        </Button>
      )}
    </Wrapper>
  );
};

const SortOption = ({ value, label }: { value: string; label: string }) => (
  <RadioGroupItem value={value}>
    <RadioGroupItemControl />
    <RadioGroupItemText textStyle="label.small">{label}</RadioGroupItemText>
    <RadioGroupItemHiddenInput />
  </RadioGroupItem>
);

export default SearchSort;
