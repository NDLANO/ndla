/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Badge,
  Button,
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxRoot,
  FieldInput,
  FieldLabel,
  FieldRoot,
  Heading,
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
  serverId?: string;
  title: string;
  questionType: "SINGLE_CHOICE" | "MULTI_CHOICE";
  required: boolean;
  alternatives: LocalAlternative[];
}

interface Props {
  question: LocalQuestion;
  isActive: boolean;
  onFocus: () => void;
  onChange: (question: LocalQuestion) => void;
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
    _selected: {
      borderColor: "stroke.default",
      boxShadow: "0 0 0 1px token(colors.stroke.default)",
    },
  },
});

const AlternativeRow = styled(HStack, {
  base: {
    alignItems: "flex-end",
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

  const setAlternatives = (alternatives: LocalAlternative[]) => onChange({ ...question, alternatives });

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
      <HStack justify="space-between">
        <Heading textStyle="heading.small" asChild consumeCss>
          <h3>{t("myNdla.quiz.form.cardTitle")}</h3>
        </Heading>
        <Badge colorTheme={question.questionType === "MULTI_CHOICE" ? "success" : "brand2"}>
          {question.questionType === "MULTI_CHOICE"
            ? t("myNdla.quiz.form.questionType.multipleChoice")
            : t("myNdla.quiz.form.questionType.singleChoice")}
        </Badge>
      </HStack>
      <FieldRoot required>
        <FieldLabel>{t("myNdla.quiz.form.questionTitle")}</FieldLabel>
        <FieldInput
          value={question.title}
          onChange={(e) => onChange({ ...question, title: e.currentTarget.value })}
          onFocus={onFocus}
          placeholder={t("myNdla.quiz.form.questionTitlePlaceholder")}
        />
      </FieldRoot>
      {question.alternatives.map((alt, altIndex) => (
        <AlternativeRow key={alt.id}>
          <AlternativeFieldRoot>
            <FieldLabel>{`${t("myNdla.quiz.form.alternative")}${
              question.alternatives.length > 2 ? ` ${altIndex + 1}` : ""
            }`}</FieldLabel>
            <FieldInput
              value={alt.text}
              onChange={(e) => onAlternativeTextChange(alt.id, e.currentTarget.value)}
              onFocus={onFocus}
              placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
            />
          </AlternativeFieldRoot>
          <CheckboxRoot
            checked={alt.isCorrect}
            onCheckedChange={(details) => onAlternativeCorrectChange(alt.id, !!details.checked)}
            aria-label={t("myNdla.quiz.correctAnswer")}
            title={t("myNdla.quiz.correctAnswer")}
          >
            <CheckboxControl />
            <CheckboxHiddenInput />
          </CheckboxRoot>
        </AlternativeRow>
      ))}
      <HStack justify="center" gap="small">
        <Button variant="tertiary" size="small" onClick={onAddAlternative}>
          {t("myNdla.quiz.form.addAlternative")}
        </Button>
        <Button
          variant="tertiary"
          size="small"
          onClick={onRemoveLastAlternative}
          disabled={question.alternatives.length <= 2}
        >
          {t("myNdla.quiz.form.removeAlternative")}
        </Button>
      </HStack>
    </Card>
  );
};
