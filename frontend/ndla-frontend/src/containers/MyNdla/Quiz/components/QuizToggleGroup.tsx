/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ToggleGroupItem, ToggleGroupRoot } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";

const Root = styled(ToggleGroupRoot, {
  base: {
    display: "flex",
    backgroundColor: "background.subtle",
    borderRadius: "xsmall",
    padding: "4xsmall",
    gap: "4xsmall",
    _disabled: {
      opacity: "0.6",
    },
  },
});

const Item = styled(ToggleGroupItem, {
  base: {
    flex: "1",
    paddingInline: "small",
    paddingBlock: "3xsmall",
    borderRadius: "xsmall",
    textStyle: "label.small",
    fontWeight: "bold",
    color: "text.subtle",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    textAlign: "center",
    "&[data-state='on']": {
      backgroundColor: "background.default",
      color: "text.strong",
    },
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  disabled?: boolean;
  "aria-label"?: string;
}

export const QuizToggleGroup = <T extends string>({ value, onChange, options, disabled, ...rest }: Props<T>) => (
  <Root
    value={[value]}
    onValueChange={(details) => details.value[0] && onChange(details.value[0] as T)}
    disabled={disabled}
    {...rest}
  >
    {options.map((option) => (
      <Item key={option.value} value={option.value}>
        {option.label}
      </Item>
    ))}
  </Root>
);
