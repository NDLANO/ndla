/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine } from "@ndla/icons";
import {
  Button,
  CheckboxControl,
  CheckboxGroup,
  CheckboxHiddenInput,
  CheckboxRoot,
  FieldInput,
  FieldLabel,
  FieldRoot,
  Heading,
  IconButton,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupItemText,
  RadioGroupRoot,
} from "@ndla/primitives";
import { HStack, styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";

export interface LocalAlternative {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface LocalQuestion {
  id: string;
  title: string;
  questionType: "SINGLE_CHOICE" | "MULTI_CHOICE";
  alternatives: LocalAlternative[];
}

interface Props {
  index: number;
  question: LocalQuestion;
  onChange: (question: LocalQuestion) => void;
  onRemove: () => void;
}

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    padding: "small",
    borderRadius: "xsmall",
    border: "1px solid",
    borderColor: "stroke.subtle",
  },
});

const AlternativeRow = styled(HStack, {
  base: {
    alignItems: "center",
    gap: "xsmall",
  },
});

export const QuizQuestionForm = ({ index, question, onChange, onRemove }: Props) => {
  const { t } = useTranslation();

  const setAlternatives = (alternatives: LocalAlternative[]) => onChange({ ...question, alternatives });

  const onAddAlternative = () => {
    setAlternatives([...question.alternatives, { id: crypto.randomUUID(), text: "", isCorrect: false }]);
  };

  const onRemoveAlternative = (id: string) => {
    setAlternatives(question.alternatives.filter((alt) => alt.id !== id));
  };

  const onAlternativeTextChange = (id: string, text: string) => {
    setAlternatives(question.alternatives.map((alt) => (alt.id === id ? { ...alt, text } : alt)));
  };

  const onSingleCorrectChange = (id: string) => {
    setAlternatives(question.alternatives.map((alt) => ({ ...alt, isCorrect: alt.id === id })));
  };

  const onMultipleCorrectChange = (ids: string[]) => {
    setAlternatives(question.alternatives.map((alt) => ({ ...alt, isCorrect: ids.includes(alt.id) })));
  };

  const onQuestionTypeChange = (questionType: "SINGLE_CHOICE" | "MULTI_CHOICE") => {
    onChange({
      ...question,
      questionType,
      alternatives: question.alternatives.map((alt) => ({ ...alt, isCorrect: false })),
    });
  };

  const correctId = question.alternatives.find((alt) => alt.isCorrect)?.id ?? "";
  const correctIds = question.alternatives.filter((alt) => alt.isCorrect).map((alt) => alt.id);

  return (
    <Card>
      <HStack justify="space-between">
        <Heading textStyle="heading.small" asChild consumeCss>
          <h3>{t("myNdla.quiz.form.questionNumber", { number: index + 1 })}</h3>
        </Heading>
        <IconButton
          aria-label={t("myNdla.quiz.form.removeQuestion")}
          title={t("myNdla.quiz.form.removeQuestion")}
          variant="tertiary"
          size="small"
          onClick={onRemove}
        >
          <DeleteBinLine />
        </IconButton>
      </HStack>
      <FieldRoot required>
        <FieldLabel>{t("myNdla.quiz.form.questionTitle")}</FieldLabel>
        <FieldInput value={question.title} onChange={(e) => onChange({ ...question, title: e.currentTarget.value })} />
      </FieldRoot>
      <FieldRoot>
        <FieldLabel>{t("myNdla.quiz.form.questionType.label")}</FieldLabel>
        <RadioGroupRoot
          value={question.questionType}
          onValueChange={(details) => onQuestionTypeChange(details.value as "SINGLE_CHOICE" | "MULTI_CHOICE")}
          orientation="horizontal"
        >
          <RadioGroupItem value="SINGLE_CHOICE">
            <RadioGroupItemControl />
            <RadioGroupItemText>{t("myNdla.quiz.form.questionType.singleChoice")}</RadioGroupItemText>
            <RadioGroupItemHiddenInput />
          </RadioGroupItem>
          <RadioGroupItem value="MULTI_CHOICE">
            <RadioGroupItemControl />
            <RadioGroupItemText>{t("myNdla.quiz.form.questionType.multipleChoice")}</RadioGroupItemText>
            <RadioGroupItemHiddenInput />
          </RadioGroupItem>
        </RadioGroupRoot>
      </FieldRoot>
      {question.questionType === "SINGLE_CHOICE" ? (
        <RadioGroupRoot value={correctId} onValueChange={(details) => onSingleCorrectChange(details.value ?? "")}>
          {question.alternatives.map((alt, altIndex) => (
            <AlternativeRow key={alt.id}>
              <RadioGroupItem value={alt.id} aria-label={`${t("myNdla.quiz.form.alternative")} ${altIndex + 1}`}>
                <RadioGroupItemControl />
                <RadioGroupItemHiddenInput />
              </RadioGroupItem>
              <FieldInput
                aria-label={`${t("myNdla.quiz.form.alternative")} ${altIndex + 1}`}
                value={alt.text}
                onChange={(e) => onAlternativeTextChange(alt.id, e.currentTarget.value)}
              />
              <IconButton
                aria-label={t("myNdla.quiz.form.removeAlternative")}
                title={t("myNdla.quiz.form.removeAlternative")}
                variant="tertiary"
                size="small"
                onClick={() => onRemoveAlternative(alt.id)}
              >
                <DeleteBinLine />
              </IconButton>
            </AlternativeRow>
          ))}
        </RadioGroupRoot>
      ) : (
        <CheckboxGroup value={correctIds} onValueChange={(value) => onMultipleCorrectChange(value)}>
          {question.alternatives.map((alt, altIndex) => (
            <AlternativeRow key={alt.id}>
              <CheckboxRoot value={alt.id} aria-label={`${t("myNdla.quiz.form.alternative")} ${altIndex + 1}`}>
                <CheckboxControl />
                <CheckboxHiddenInput />
              </CheckboxRoot>
              <FieldInput
                aria-label={`${t("myNdla.quiz.form.alternative")} ${altIndex + 1}`}
                value={alt.text}
                onChange={(e) => onAlternativeTextChange(alt.id, e.currentTarget.value)}
              />
              <IconButton
                aria-label={t("myNdla.quiz.form.removeAlternative")}
                title={t("myNdla.quiz.form.removeAlternative")}
                variant="tertiary"
                size="small"
                onClick={() => onRemoveAlternative(alt.id)}
              >
                <DeleteBinLine />
              </IconButton>
            </AlternativeRow>
          ))}
        </CheckboxGroup>
      )}
      <Button variant="tertiary" size="small" onClick={onAddAlternative}>
        {t("myNdla.quiz.form.addAlternative")}
      </Button>
    </Card>
  );
};
