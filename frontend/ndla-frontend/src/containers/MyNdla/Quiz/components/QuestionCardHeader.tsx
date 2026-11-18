/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowDownShortLine, ArrowUpShortLine } from "@ndla/icons";
import { Button, Text } from "@ndla/primitives";
import { HStack } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { NumberBadge } from "../../components/NumberBadge";

interface Props {
  index: number;
  title?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const QuestionCardHeader = ({ index, title, onMoveUp, onMoveDown }: Props) => {
  const { t } = useTranslation();

  return (
    <HStack justify="space-between" gap="xsmall">
      <HStack gap="medium">
        <NumberBadge size="medium" textStyle="label.medium" asChild consumeCss>
          <span>{index + 1}</span>
        </NumberBadge>
        <Text fontWeight="bold" textStyle="label.large" css={{ lineClamp: "1" }}>
          {title || t("myNdla.quiz.form.cardTitle")}
        </Text>
      </HStack>
      <HStack gap="xsmall">
        {onMoveDown ? (
          <Button variant="tertiary" onClick={onMoveDown}>
            {t("myNdla.quiz.form.moveDown")}
            <ArrowDownShortLine />
          </Button>
        ) : null}
        {onMoveUp ? (
          <Button variant="tertiary" onClick={onMoveUp}>
            {t("myNdla.quiz.form.moveUp")}
            <ArrowUpShortLine />
          </Button>
        ) : null}
      </HStack>
    </HStack>
  );
};
