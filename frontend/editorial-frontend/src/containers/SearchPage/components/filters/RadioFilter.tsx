/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupItemText,
  RadioGroupLabel,
  RadioGroupRoot,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SelectOption } from "../../../../components/ObjectSelector";
import { FilterContainer, getVisibleOptions, ShowMoreToggle } from "./FilterGroup";

const ALL_VALUE = "__all";

const StyledRadioGroupRoot = styled(RadioGroupRoot, {
  base: {
    gap: "xxsmall",
  },
});

interface Props {
  title: string;
  name: string;
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  collapsedCount?: number;
}

export const RadioFilter = ({ title, name, options, value, onChange, collapsedCount }: Props) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const allOptions = useMemo(() => [{ id: ALL_VALUE, name: t("searchForm.all") }, ...options], [options, t]);
  const currentValue = value || ALL_VALUE;
  const visibleOptions = getVisibleOptions(allOptions, [currentValue], collapsedCount, expanded);

  return (
    <FilterContainer data-testid={`${name}-filter`}>
      <StyledRadioGroupRoot
        orientation="vertical"
        value={currentValue}
        onValueChange={(details) => onChange(details.value === ALL_VALUE ? null : details.value)}
      >
        <RadioGroupLabel textStyle="label.medium" fontWeight="bold" asChild consumeCss>
          <h3>{title}</h3>
        </RadioGroupLabel>
        {visibleOptions.map((option) => (
          <RadioGroupItem key={option.id} value={option.id} disabled={option.disabled}>
            <RadioGroupItemControl />
            <RadioGroupItemText>{option.name}</RadioGroupItemText>
            <RadioGroupItemHiddenInput />
          </RadioGroupItem>
        ))}
      </StyledRadioGroupRoot>
      <ShowMoreToggle
        count={allOptions.length}
        collapsedCount={collapsedCount}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
      />
    </FilterContainer>
  );
};
