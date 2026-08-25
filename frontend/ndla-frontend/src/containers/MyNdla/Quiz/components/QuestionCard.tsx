/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddLine, SubtractLine } from "@ndla/icons";
import {
  Badge,
  Button,
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxRoot,
  FieldInput,
  FieldLabel,
  FieldRoot,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupRoot,
} from "@ndla/primitives";
import { HStack, styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";

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
  alternatives: AlternativeFormValues[];
}

interface Props {
  question: QuestionFormValues;
  isActive: boolean;
  onFocus: () => void;
  onChange: (question: QuestionFormValues) => void;
}

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "small",
    padding: "small",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
    _hover: {
      border: "1px solid",
      borderColor: "stroke.hover",
      boxShadow: "xsmall",
    },
    _selected: {
      border: "1px solid",
      borderColor: "stroke.hover",
      boxShadow: "xsmall",
    },
  },
});

const QuestionTitleFieldRoot = styled(FieldRoot, {
  base: {
    flex: "1",
  },
});

const AlternativeCheckboxRoot = styled(CheckboxRoot, {
  base: {
    alignItems: "center",
    gap: "xsmall",
    width: "100%",
  },
});

const AlternativeRadioItem = styled(RadioGroupItem, {
  base: {
    alignItems: "center",
    gap: "xsmall",
  },
});

const AlternativeFieldRoot = styled(FieldRoot, {
  base: {
    flex: "1",
  },
});

export const QuestionCard = ({ question, isActive, onFocus, onChange }: Props) => {
  const { t } = useTranslation();

  const setAlternatives = (alternatives: AlternativeFormValues[]) => onChange({ ...question, alternatives });

  const onAddAlternative = () => {
    setAlternatives([...question.alternatives, { id: crypto.randomUUID(), text: "", isCorrect: false }]);
  };

  const onRemoveLastAlternative = () => {
    setAlternatives(question.alternatives.slice(0, -1));
  };

  const onAlternativeTextChange = (id: string, text: string) => {
    setAlternatives(question.alternatives.map((alt) => (alt.id === id ? { ...alt, text } : alt)));
  };

  const onAlternativeCorrectChange = (id: string, isCorrect: boolean) => {
    if (question.questionType === "SINGLE_CHOICE") {
      setAlternatives(question.alternatives.map((alt) => ({ ...alt, isCorrect: alt.id === id && isCorrect })));
    } else {
      setAlternatives(question.alternatives.map((alt) => (alt.id === id ? { ...alt, isCorrect } : alt)));
    }
  };

  return (
    <Card aria-selected={isActive} onFocus={onFocus}>
      <HStack justify="space-between" gap="xsmall">
        <QuestionTitleFieldRoot>
          <FieldLabel srOnly>{t("myNdla.quiz.form.questionTitlePlaceholder")}</FieldLabel>
          <FieldInput
            value={question.title}
            onChange={(e) => onChange({ ...question, title: e.currentTarget.value })}
            onFocus={onFocus}
            placeholder={t("myNdla.quiz.form.questionTitlePlaceholder")}
            css={{
              border: "0",
              boxShadow: "none",
              textStyle: "label.large.strong",
              fontWeight: "bold",
              _hover: { boxShadow: "none" },
              _focusWithin: { boxShadow: "none" },
            }}
          />
        </QuestionTitleFieldRoot>
        <Badge colorTheme="brand3" css={{ flexShrink: "0", whiteSpace: "nowrap" }}>
          {question.questionType === "MULTI_CHOICE"
            ? t("myNdla.quiz.form.questionType.multipleChoice")
            : t("myNdla.quiz.form.questionType.singleChoice")}
        </Badge>
      </HStack>
      {question.questionType === "SINGLE_CHOICE" ? (
        <RadioGroupRoot
          value={question.alternatives.find((alt) => alt.isCorrect)?.id ?? null}
          onValueChange={(details) => details.value && onAlternativeCorrectChange(details.value, true)}
        >
          {question.alternatives.map((alt) => (
            <AlternativeRadioItem key={alt.id} value={alt.id} title={t("myNdla.quiz.correctAnswer")}>
              <AlternativeFieldRoot>
                <FieldInput
                  value={alt.text}
                  onChange={(e) => onAlternativeTextChange(alt.id, e.currentTarget.value)}
                  onFocus={onFocus}
                  placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
                  aria-label={t("myNdla.quiz.form.alternativePlaceholder")}
                />
              </AlternativeFieldRoot>
              <RadioGroupItemControl />
              <RadioGroupItemHiddenInput />
            </AlternativeRadioItem>
          ))}
        </RadioGroupRoot>
      ) : (
        question.alternatives.map((alt) => (
          <AlternativeCheckboxRoot
            key={alt.id}
            checked={alt.isCorrect}
            onCheckedChange={(details) => onAlternativeCorrectChange(alt.id, !!details.checked)}
            title={t("myNdla.quiz.correctAnswer")}
          >
            <AlternativeFieldRoot>
              <FieldInput
                value={alt.text}
                onChange={(e) => onAlternativeTextChange(alt.id, e.currentTarget.value)}
                onFocus={onFocus}
                placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
                aria-label={t("myNdla.quiz.form.alternativePlaceholder")}
              />
            </AlternativeFieldRoot>
            <CheckboxControl />
            <CheckboxHiddenInput />
          </AlternativeCheckboxRoot>
        ))
      )}
      <HStack justify="center" gap="small">
        <Button variant="tertiary" size="small" onClick={onAddAlternative}>
          <AddLine />
          {t("myNdla.quiz.form.addAlternative")}
        </Button>
        {question.alternatives.length > 2 && (
          <Button variant="tertiary" size="small" onClick={onRemoveLastAlternative}>
            <SubtractLine />
            {t("myNdla.quiz.form.removeAlternative")}
          </Button>
        )}
      </HStack>
    </Card>
  );
};
