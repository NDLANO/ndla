/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddLine } from "@ndla/icons";
import {
  Button,
  FieldInput,
  FieldLabel,
  FieldRoot,
  SwitchControl,
  SwitchHiddenInput,
  SwitchLabel,
  SwitchRoot,
  SwitchThumb,
  Text,
} from "@ndla/primitives";
import { HStack, styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { AlternativesList } from "./AlternativesList";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionDeleteDialog } from "./QuestionDeleteDialog";

export interface AlternativeFormValues {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionFormValues {
  id: string;
  serverId?: string;
  title: string;
  questionType: "SINGLE_CHOICE" | "MULTI_CHOICE";
  required: boolean;
  alternativesRandomOrder: boolean;
  alternatives: AlternativeFormValues[];
}

interface Props {
  question: QuestionFormValues;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showMoveButtons: boolean;
  onChange: (question: QuestionFormValues) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  error?: string;
}

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "medium",
    padding: "medium",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
    _hover: {
      borderColor: "stroke.hover",
    },
    _focusWithin: {
      borderColor: "stroke.hover",
    },
  },
});

export const QuestionCard = ({
  question,
  index,
  canMoveUp,
  canMoveDown,
  showMoveButtons,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  error,
}: Props) => {
  const { t } = useTranslation();

  const setAlternatives = (alternatives: AlternativeFormValues[]) => onChange({ ...question, alternatives });

  const onAddAlternative = () => {
    setAlternatives([...question.alternatives, { id: crypto.randomUUID(), text: "", isCorrect: false }]);
  };

  const onRemoveAlternative = (id: string) => {
    setAlternatives(question.alternatives.filter((alt) => alt.id !== id));
  };

  const onAlternativeTextChange = (id: string, text: string) => {
    setAlternatives(question.alternatives.map((alt) => (alt.id === id ? { ...alt, text } : alt)));
  };

  const onAlternativeCorrectChange = (id: string, isCorrect: boolean) => {
    if (question.questionType === "SINGLE_CHOICE") {
      setAlternatives(
        question.alternatives.map((alt) => ({
          ...alt,
          isCorrect: alt.id === id && isCorrect,
        })),
      );
    } else {
      setAlternatives(question.alternatives.map((alt) => (alt.id === id ? { ...alt, isCorrect } : alt)));
    }
  };

  const onQuestionTypeChange = (multiChoice: boolean) => {
    onChange({
      ...question,
      questionType: multiChoice ? "MULTI_CHOICE" : "SINGLE_CHOICE",
      alternatives: question.alternatives.map((alt) => ({
        ...alt,
        isCorrect: false,
      })),
    });
  };

  return (
    <Card>
      <QuestionCardHeader
        index={index}
        questionType={question.questionType}
        onQuestionTypeChange={onQuestionTypeChange}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        showMoveButtons={showMoveButtons}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      <FieldRoot>
        <FieldLabel>{t("myNdla.quiz.form.questionTitle")}</FieldLabel>
        <FieldInput
          value={question.title}
          onChange={(e) => onChange({ ...question, title: e.currentTarget.value })}
          placeholder={t("myNdla.quiz.form.questionTitlePlaceholder")}
        />
      </FieldRoot>
      <HStack justify="flex-end" css={{ width: "100%" }}>
        <SwitchRoot
          checked={question.alternativesRandomOrder}
          onCheckedChange={(details) => onChange({ ...question, alternativesRandomOrder: details.checked })}
        >
          <SwitchLabel textStyle="label.small">{t("myNdla.quiz.form.settings.randomOrder")}</SwitchLabel>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchHiddenInput />
        </SwitchRoot>
      </HStack>
      <AlternativesList
        alternatives={question.alternatives}
        questionType={question.questionType}
        randomOrder={question.alternativesRandomOrder}
        onReorder={setAlternatives}
        onTextChange={onAlternativeTextChange}
        onCorrectChange={onAlternativeCorrectChange}
        onRemove={onRemoveAlternative}
      />
      {!!error && (
        <Text textStyle="label.small" color="text.error">
          {error}
        </Text>
      )}
      <HStack justify="space-between" gap="small">
        <HStack gap="small">
          <Button variant="tertiary" size="small" onClick={onAddAlternative}>
            <AddLine />
            {t("myNdla.quiz.form.addAlternative")}
          </Button>
        </HStack>
        <QuestionDeleteDialog onDelete={onDelete} />
      </HStack>
    </Card>
  );
};
