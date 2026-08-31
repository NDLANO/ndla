/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { QuizToggleGroup } from "./QuizToggleGroup";

const QUESTION_COUNT_OPTIONS = ["5", "10", "15", "20"] as const;

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
    gap: "3xsmall",
    tabletWide: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  },
});

export interface QuestionCountOption {
  value: (typeof QUESTION_COUNT_OPTIONS)[number];
}

interface Props {
  randomSubset: boolean;
  onRandomSubsetChange: (value: boolean) => void;
  questionCount: (typeof QUESTION_COUNT_OPTIONS)[number];
  onQuestionCountChange: (value: (typeof QUESTION_COUNT_OPTIONS)[number]) => void;
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
      <Heading textStyle="heading.small" asChild consumeCss>
        <h2>{t("myNdla.quiz.form.settingsTab.title")}</h2>
      </Heading>
      <Text textStyle="label.small">{t("myNdla.quiz.form.settingsTab.description")}</Text>
      <SettingRow>
        <Text fontWeight="bold" textStyle="label.medium">
          {t("myNdla.quiz.form.settingsTab.randomSubset")}
        </Text>
        <QuizToggleGroup
          value={randomSubset ? "yes" : "no"}
          onChange={(value) => onRandomSubsetChange(value === "yes")}
          options={[
            { value: "yes", label: t("myNdla.quiz.form.settings.yes") },
            { value: "no", label: t("myNdla.quiz.form.settings.no") },
          ]}
        />
      </SettingRow>
      <SettingRow>
        <Text fontWeight="bold" textStyle="label.medium">
          {t("myNdla.quiz.form.settingsTab.questionCount")}
        </Text>
        <QuizToggleGroup
          value={questionCount}
          onChange={onQuestionCountChange}
          disabled={!randomSubset}
          options={QUESTION_COUNT_OPTIONS.map((count) => ({ value: count, label: count }))}
        />
      </SettingRow>
    </Panel>
  );
};
