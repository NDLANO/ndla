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
import { useId, type ReactNode } from "react";
import type { SelectOption } from "../../../../components/ObjectSelector";
import { FilterGroup } from "./FilterGroup";

interface Props {
  title: string;
  name: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  activeCount?: number;
  children?: ReactNode;
}

export const CheckboxFilter = ({ title, name, options, value, onChange, activeCount, children }: Props) => {
  const headingId = useId();
  return (
    <FilterGroup title={title} name={name} headingId={headingId} activeCount={activeCount ?? value.length}>
      <CheckboxGroup value={value} onValueChange={onChange} aria-labelledby={headingId}>
        {options.map((option) => (
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
      {children}
    </FilterGroup>
  );
};
