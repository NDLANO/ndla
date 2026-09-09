/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CheckLine } from "@ndla/icons";
import { CheckboxControl, CheckboxHiddenInput, CheckboxIndicator, CheckboxLabel, CheckboxRoot } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";

interface Props {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  name: string;
  title?: string;
  disabled?: boolean;
}

const StyledCheckboxRoot = styled(CheckboxRoot, {
  base: {
    padding: "3xsmall",
  },
});

const CheckboxSelector = ({ name, checked, onCheckedChange, title, disabled }: Props) => {
  const { t } = useTranslation();

  return (
    <StyledCheckboxRoot
      title={title}
      disabled={disabled}
      checked={checked}
      onCheckedChange={(details) => onCheckedChange(details.checked as boolean)}
    >
      <CheckboxControl>
        <CheckboxIndicator asChild>
          <CheckLine />
        </CheckboxIndicator>
      </CheckboxControl>
      <CheckboxLabel>{t(`searchForm.types.${name}`)}</CheckboxLabel>
      <CheckboxHiddenInput />
    </StyledCheckboxRoot>
  );
};

export default CheckboxSelector;
