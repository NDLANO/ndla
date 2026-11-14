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
  RadioGroupRoot,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SelectOption } from "../../../../components/ObjectSelector";
import { FilterGroup } from "./FilterGroup";

const ALL_VALUE = "__all";

const StyledRadioGroupRoot = styled(RadioGroupRoot, {
  base: {
    gap: "xxsmall",
    _horizontal: {
      gap: "small",
    },
  },
});

interface FilterRadioGroupProps {
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  labelledBy: string;
  orientation?: "horizontal" | "vertical";
}

export const FilterRadioGroup = ({
  options,
  value,
  onChange,
  labelledBy,
  orientation = "vertical",
}: FilterRadioGroupProps) => {
  const { t } = useTranslation();
  const allOptions = useMemo(() => [{ id: ALL_VALUE, name: t("searchForm.all") }, ...options], [options, t]);

  return (
    <StyledRadioGroupRoot
      orientation={orientation}
      aria-labelledby={labelledBy}
      value={value || ALL_VALUE}
      onValueChange={(details) => onChange(details.value === ALL_VALUE ? null : details.value)}
    >
      {allOptions.map((option) => (
        <RadioGroupItem key={option.id} value={option.id} disabled={option.disabled}>
          <RadioGroupItemControl />
          <RadioGroupItemText>{option.name}</RadioGroupItemText>
          <RadioGroupItemHiddenInput />
        </RadioGroupItem>
      ))}
    </StyledRadioGroupRoot>
  );
};

interface Props {
  title: string;
  name: string;
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export const RadioFilter = ({ title, name, options, value, onChange }: Props) => {
  const headingId = useId();

  return (
    <FilterGroup title={title} name={name} headingId={headingId} activeCount={value ? 1 : 0}>
      <FilterRadioGroup options={options} value={value} onChange={onChange} labelledBy={headingId} />
    </FilterGroup>
  );
};
