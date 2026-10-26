/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowDownShortLine, ArrowUpShortLine } from "@ndla/icons";
import {
  IconButton,
  SwitchControl,
  SwitchHiddenInput,
  SwitchLabel,
  SwitchRoot,
  SwitchThumb,
  Text,
} from "@ndla/primitives";
import { HStack } from "@ndla/styled-system/jsx";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { NumberBadge } from "../../components/NumberBadge";
import type { QuestionFormValues } from "./QuestionCard";

interface Props {
  index: number;
  questionType: QuestionFormValues["questionType"];
  onQuestionTypeChange: (multiChoice: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  autoFocus?: boolean;
}

export const QuestionCardHeader = ({
  index,
  questionType,
  onQuestionTypeChange,
  onMoveUp,
  onMoveDown,
  autoFocus,
}: Props) => {
  const { t } = useTranslation();
  const multipleAnswersRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) multipleAnswersRef.current?.focus();
    // Only on mount
  }, []);

  return (
    <HStack justify="space-between" gap="xsmall">
      <HStack gap="medium">
        <NumberBadge size="medium" textStyle="label.medium" asChild consumeCss>
          <span>{index + 1}</span>
        </NumberBadge>
        <Text fontWeight="bold" textStyle="label.large">
          {t("myNdla.quiz.form.cardTitle")}
        </Text>
      </HStack>
      <HStack gap="medium">
        <SwitchRoot
          checked={questionType === "MULTI_CHOICE"}
          onCheckedChange={(details) => onQuestionTypeChange(details.checked)}
        >
          <SwitchLabel textStyle="label.small">{t("myNdla.quiz.form.settings.multipleAnswers")}</SwitchLabel>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchHiddenInput ref={multipleAnswersRef} />
        </SwitchRoot>
        {onMoveUp ? (
          <IconButton
            aria-label={t("myNdla.quiz.form.moveUp")}
            title={t("myNdla.quiz.form.moveUp")}
            variant="tertiary"
            size="small"
            onClick={onMoveUp}
          >
            <ArrowUpShortLine />
          </IconButton>
        ) : null}
        {onMoveDown ? (
          <IconButton
            aria-label={t("myNdla.quiz.form.moveDown")}
            title={t("myNdla.quiz.form.moveDown")}
            variant="tertiary"
            size="small"
            onClick={onMoveDown}
          >
            <ArrowDownShortLine />
          </IconButton>
        ) : null}
      </HStack>
    </HStack>
  );
};
