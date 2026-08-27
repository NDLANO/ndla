/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createListCollection } from "@ark-ui/react";
import { ArrowDownShortLine } from "@ndla/icons";
import {
  Button,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  FieldLabel,
  FieldRoot,
  SelectContent,
  SelectControl,
  SelectIndicator,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { GenericSelectItem } from "../../../../components/abstractions/Select";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";
import type { QuestionFormValues } from "./QuestionCard";

const YesNoFieldStyled = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "3xsmall",
    width: "100%",
    borderRadius: "xsmall",
    backgroundColor: "background.default",
    border: "1px solid",
    borderColor: "stroke.subtle",
    paddingInline: "xsmall",
    paddingBlock: "3xsmall",
    textStyle: "label.small",
    cursor: "pointer",
    _hover: {
      borderColor: "stroke.hover",
    },
    "&[data-state='open'] svg": {
      transform: "rotate(180deg)",
    },
  },
});

const YesNoSelectTrigger = ({ children }: { children: ReactNode }) => (
  <SelectControl>
    <SelectTrigger asChild>
      <YesNoFieldStyled>
        {children}
        <SelectIndicator>
          <ArrowDownShortLine />
        </SelectIndicator>
      </YesNoFieldStyled>
    </SelectTrigger>
  </SelectControl>
);

interface YesNoFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const YesNoField = ({ label, value, onChange }: YesNoFieldProps) => {
  const { t } = useTranslation();
  const items = [
    { value: "yes", label: t("myNdla.quiz.form.settings.yes") },
    { value: "no", label: t("myNdla.quiz.form.settings.no") },
  ];
  const collection = createListCollection({
    items,
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  });

  return (
    <FieldRoot>
      <FieldLabel>{label}</FieldLabel>
      <SelectRoot
        collection={collection}
        value={[value]}
        onValueChange={(details) => details.value[0] && onChange(details.value[0])}
        positioning={{ sameWidth: true }}
      >
        <YesNoSelectTrigger>
          <SelectValueText />
        </YesNoSelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <GenericSelectItem key={item.value} item={item}>
              {item.label}
            </GenericSelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </FieldRoot>
  );
};

const DialogBodyColumn = styled(DialogBody, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
  },
});

interface Props {
  question: QuestionFormValues;
  onChange: (question: QuestionFormValues) => void;
}

export const QuestionSettingsDialog = ({ question, onChange }: Props) => {
  const { t } = useTranslation();

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="small">
          {t("myNdla.quiz.form.settings.title")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("myNdla.quiz.form.settings.title")}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBodyColumn>
          <YesNoField
            label={t("myNdla.quiz.form.settings.randomOrder")}
            value={question.alternativesRandomOrder ? "yes" : "no"}
            onChange={(value) => onChange({ ...question, alternativesRandomOrder: value === "yes" })}
          />
          <YesNoField
            label={t("myNdla.quiz.form.settings.required")}
            value={question.required ? "yes" : "no"}
            onChange={(value) => onChange({ ...question, required: value === "yes" })}
          />
        </DialogBodyColumn>
      </DialogContent>
    </DialogRoot>
  );
};
