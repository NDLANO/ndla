/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CheckLine } from "@ndla/icons";
import {
  CheckboxControl,
  CheckboxGroup,
  CheckboxHiddenInput,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxRoot,
} from "@ndla/primitives";
import { useState, type ReactNode } from "react";
import type { SelectOption } from "../../../../components/ObjectSelector";
import { FilterGroup, getVisibleOptions, ShowMoreToggle } from "./FilterGroup";

interface Props {
  title: string;
  name: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  collapsedCount?: number;
  children?: ReactNode;
}

export const CheckboxFilter = ({ title, name, options, value, onChange, collapsedCount, children }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const visibleOptions = getVisibleOptions(options, value, collapsedCount, expanded);

  return (
    <FilterGroup title={title} data-testid={`${name}-filter`}>
      <CheckboxGroup value={value} onValueChange={onChange}>
        {visibleOptions.map((option) => (
          <CheckboxRoot key={option.id} value={option.id} disabled={option.disabled}>
            <CheckboxControl>
              <CheckboxIndicator asChild>
                <CheckLine />
              </CheckboxIndicator>
            </CheckboxControl>
            <CheckboxLabel>{option.name}</CheckboxLabel>
            <CheckboxHiddenInput />
          </CheckboxRoot>
        ))}
      </CheckboxGroup>
      <ShowMoreToggle
        count={options.length}
        collapsedCount={collapsedCount}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
      />
      {children}
    </FilterGroup>
  );
};
