/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createListCollection } from "@ark-ui/react";
import { CheckLine } from "@ndla/icons";
import {
  FieldLabel,
  FieldRoot,
  Heading,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import type { LocalQuestion } from "./QuestionCard";

const Panel = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    padding: "small",
    borderRadius: "xsmall",
    border: "1px solid",
    borderColor: "stroke.subtle",
    height: "fit-content",
    tabletDown: {
      display: "none",
    },
  },
});

interface Props {
  activeQuestion: LocalQuestion | undefined;
  randomOrder: boolean;
  onRandomOrderChange: (value: boolean) => void;
  onQuestionTypeChange: (questionType: "SINGLE_CHOICE" | "MULTI_CHOICE") => void;
  onRequiredChange: (required: boolean) => void;
  onDuplicateQuestion: () => void;
  onDeleteQuestion: () => void;
}

export const QuizSettingsPanel = ({
  activeQuestion,
  randomOrder,
  onRandomOrderChange,
  onQuestionTypeChange,
  onRequiredChange,
  onDuplicateQuestion,
  onDeleteQuestion,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Panel>
      <Heading textStyle="heading.small" asChild consumeCss>
        <h2>{t("myNdla.quiz.form.settings.title")}</h2>
      </Heading>
      <Text textStyle="label.small">{t("myNdla.quiz.form.settings.description")}</Text>
      <YesNoField
        label={t("myNdla.quiz.form.settings.taskType")}
        value="quiz"
        onChange={() => {}}
        options={[{ value: "quiz", label: t("myNdla.quiz.form.settings.taskTypeQuiz") }]}
        disabled
      />
      <YesNoField
        label={t("myNdla.quiz.form.settings.multipleAnswers")}
        value={activeQuestion?.questionType === "MULTI_CHOICE" ? "yes" : "no"}
        onChange={(value) => onQuestionTypeChange(value === "yes" ? "MULTI_CHOICE" : "SINGLE_CHOICE")}
        disabled={!activeQuestion}
      />
      <YesNoField
        label={t("myNdla.quiz.form.settings.randomOrder")}
        value={randomOrder ? "yes" : "no"}
        onChange={(value) => onRandomOrderChange(value === "yes")}
      />
      <YesNoField
        label={t("myNdla.quiz.form.settings.required")}
        value={activeQuestion?.required ? "yes" : "no"}
        onChange={(value) => onRequiredChange(value === "yes")}
        disabled={!activeQuestion}
      />
      <YesNoField
        label={t("myNdla.quiz.form.settings.duplicate")}
        value="no"
        onChange={(value) => value === "yes" && onDuplicateQuestion()}
        disabled={!activeQuestion}
      />
      <YesNoField
        label={t("myNdla.quiz.form.settings.delete")}
        value="no"
        onChange={(value) => value === "yes" && onDeleteQuestion()}
        disabled={!activeQuestion}
      />
    </Panel>
  );
};

interface YesNoFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options?: { value: string; label: string }[];
}

const defaultYesNoOptions = (t: (key: string) => string) => [
  { value: "yes", label: t("myNdla.quiz.form.settings.yes") },
  { value: "no", label: t("myNdla.quiz.form.settings.no") },
];

const YesNoField = ({ label, value, onChange, disabled, options }: YesNoFieldProps) => {
  const { t } = useTranslation();
  const items = options ?? defaultYesNoOptions(t);
  const collection = createListCollection({
    items,
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  });

  return (
    <FieldRoot disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      <SelectRoot
        collection={collection}
        value={[value]}
        onValueChange={(details) => details.value[0] && onChange(details.value[0])}
        positioning={{ sameWidth: true }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValueText />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} item={item}>
              <SelectItemText>{item.label}</SelectItemText>
              <SelectItemIndicator>
                <CheckLine />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </FieldRoot>
  );
};
