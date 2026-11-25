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

export const QUIZ_SORT_LAST_ADDED = "-created";
const QUIZ_SORT_FIRST_ADDED = "created";

export type QuizSort = typeof QUIZ_SORT_LAST_ADDED | typeof QUIZ_SORT_FIRST_ADDED;

export const parseQuizSort = (value: string | null): QuizSort =>
  value === QUIZ_SORT_FIRST_ADDED ? QUIZ_SORT_FIRST_ADDED : QUIZ_SORT_LAST_ADDED;

const sortOptions = [
  { value: QUIZ_SORT_LAST_ADDED, transKey: "lastAdded" },
  { value: QUIZ_SORT_FIRST_ADDED, transKey: "firstAdded" },
] as const;

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

interface Props {
  value: QuizSort;
  onChange: (value: QuizSort) => void;
}

export const QuizSortSelect = ({ value, onChange }: Props) => {
  const { t } = useTranslation();

  const collection = useMemo(
    () =>
      createListCollection({
        items: sortOptions,
        itemToString: (item) => t(`myNdla.quiz.sort.${item.transKey}`),
        itemToValue: (item) => item.value,
      }),
    [t],
  );

  return (
    <Wrapper>
      <SelectRoot
        collection={collection}
        value={[value]}
        onValueChange={(details) => onChange(parseQuizSort(details.value[0] ?? null))}
        positioning={{ sameWidth: true }}
      >
        <SelectLabel srOnly>{t("myNdla.quiz.sort.label")}</SelectLabel>
        <SelectControl>
          <StyledSelectTrigger asChild>
            <Button variant="secondary" size="small">
              <Text asChild consumeCss textStyle="label.small" color="text.subtle">
                <span aria-hidden>{t("myNdla.quiz.sort.label")}</span>
              </Text>
              <StyledSelectValueText />
              <ArrowDownShortLine size="small" />
            </Button>
          </StyledSelectTrigger>
        </SelectControl>
        <SelectContent>
          {collection.items.map((option) => (
            <SelectItem key={option.value} item={option}>
              <SelectItemText>{t(`myNdla.quiz.sort.${option.transKey}`)}</SelectItemText>
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
