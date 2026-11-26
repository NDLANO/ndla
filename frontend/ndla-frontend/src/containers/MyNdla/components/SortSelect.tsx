/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createListCollection } from "@ark-ui/react/collection";
import { ArrowDownShortLine, CheckLine } from "@ndla/icons";
import {
  Button,
  SelectContent,
  SelectControl,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const Wrapper = styled("div", {
  base: {
    alignSelf: "flex-end",
  },
});

const StyledSelectTrigger = styled(SelectTrigger, {
  base: {
    width: "max",
  },
});

const StyledSelectValueText = styled(SelectValueText, {
  base: {
    fontWeight: "bold",
  },
});

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: SortOption<T>[];
  onValueChange: (value: T) => void;
}

export const SortSelect = <T extends string>({ value, options, onValueChange }: Props<T>) => {
  const { t } = useTranslation();

  const collection = useMemo(
    () =>
      createListCollection({
        items: options,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
      }),
    [options],
  );

  return (
    <Wrapper>
      <SelectRoot
        collection={collection}
        value={[value]}
        onValueChange={(details) => {
          const item = details.items[0];
          if (item) onValueChange(item.value);
        }}
        positioning={{ sameWidth: true }}
      >
        <SelectLabel srOnly>{t("myNdla.sort.label")}</SelectLabel>
        <SelectControl>
          <StyledSelectTrigger asChild>
            <Button variant="secondary" size="small">
              <Text asChild consumeCss textStyle="label.small" color="text.subtle">
                <span aria-hidden>{t("myNdla.sort.label")}</span>
              </Text>
              <StyledSelectValueText />
              <ArrowDownShortLine size="small" />
            </Button>
          </StyledSelectTrigger>
        </SelectControl>
        <SelectContent>
          {collection.items.map((option) => (
            <SelectItem key={option.value} item={option}>
              <SelectItemText>{option.label}</SelectItemText>
              <SelectItemIndicator>
                <CheckLine />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </Wrapper>
  );
};
