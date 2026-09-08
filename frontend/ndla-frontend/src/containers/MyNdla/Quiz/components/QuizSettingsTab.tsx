/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Heading,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupItemText,
  RadioGroupLabel,
  RadioGroupRoot,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import type { QuestionCountOption } from "./QuizBuilder";

const QUESTION_COUNT_OPTIONS: QuestionCountOption[] = ["5", "10", "15", "20"];

const Panel = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "small",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
    padding: "small",
  },
});

const SettingRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const StyledHeading = styled(Heading, {
  base: {
    textStyle: "label.medium",
    fontWeight: "bold",
    fontSize: "small",
  },
});

const StyledRadioGroupLabel = styled(RadioGroupLabel, {
  base: {
    textStyle: "label.small",
    fontWeight: "bold",
    fontSize: "xsmall",
  },
});

const StyledRadioGroupItemText = styled(RadioGroupItemText, {
  base: {
    textStyle: "label.medium",
    fontSize: "xsmall",
  },
});

interface Props {
  randomSubset: boolean;
  onRandomSubsetChange: (value: boolean) => void;
  questionCount: QuestionCountOption;
  onQuestionCountChange: (value: QuestionCountOption) => void;
}

export const QuizSettingsTab = ({
  randomSubset,
  onRandomSubsetChange,
  questionCount,
  onQuestionCountChange,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Panel>
      <StyledHeading asChild consumeCss>
        <h2>{t("myNdla.quiz.form.settingsTab.title")}</h2>
      </StyledHeading>
      <Text textStyle="body.medium">{t("myNdla.quiz.form.settingsTab.description")}</Text>
      <SettingRow>
        <RadioGroupRoot
          orientation="vertical"
          value={randomSubset ? "yes" : "no"}
          onValueChange={(details) => onRandomSubsetChange(details.value === "yes")}
        >
          <StyledRadioGroupLabel>{t("myNdla.quiz.form.settingsTab.randomSubset")}</StyledRadioGroupLabel>
          {["yes", "no"].map((value) => (
            <RadioGroupItem value={value} key={value}>
              <RadioGroupItemControl />
              <StyledRadioGroupItemText>
                {value === "yes" ? t("myNdla.quiz.form.settings.yes") : t("myNdla.quiz.form.settings.no")}
              </StyledRadioGroupItemText>
              <RadioGroupItemHiddenInput />
            </RadioGroupItem>
          ))}
        </RadioGroupRoot>
      </SettingRow>
      <SettingRow>
        <RadioGroupRoot
          orientation="vertical"
          value={questionCount}
          onValueChange={(details) => onQuestionCountChange(details.value as QuestionCountOption)}
          disabled={!randomSubset}
        >
          <StyledRadioGroupLabel>{t("myNdla.quiz.form.settingsTab.questionCount")}</StyledRadioGroupLabel>
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <RadioGroupItem value={count} key={count}>
              <RadioGroupItemControl />
              <StyledRadioGroupItemText>{count}</StyledRadioGroupItemText>
              <RadioGroupItemHiddenInput />
            </RadioGroupItem>
          ))}
        </RadioGroupRoot>
      </SettingRow>
    </Panel>
  );
};
