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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { QuestionCountOption, QuizBuilderState } from "./QuizBuilder";
import { QUESTION_COUNT_OPTIONS } from "./quizBuilderUtils";

const MIN_QUESTIONS_FOR_RANDOM_SUBSET = 6;

const Panel = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "full",
    maxWidth: "[1084px]",
    gap: "medium",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
    paddingBlockStart: "medium",
    paddingBlockEnd: "large",
    paddingInline: "medium",
  },
});

const SettingRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
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
    fontWeight: "normal",
    fontSize: "xsmall",
  },
});

const StyledRadioGroupItemText = styled(RadioGroupItemText, {
  base: {
    textStyle: "label.medium",
    fontSize: "xsmall",
  },
});

const RadioRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "small",
  },
});

const Section = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const Separator = styled("hr", {
  base: {
    height: "[1px]",
    color: "stroke.subtle",
  },
});

const SettingsGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "medium",
    tablet: {
      gridTemplateColumns: "1fr 1fr",
    },
  },
});

const StyledSectionHeading = styled(Heading, {
  base: {
    textStyle: "label.medium",
    fontWeight: "bold",
    fontSize: "small",
  },
});

interface YesNoSettingProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const YesNoSetting = ({ label, value, onChange }: YesNoSettingProps) => {
  const { t } = useTranslation();
  return (
    <SettingRow>
      <RadioGroupRoot
        orientation="vertical"
        value={value ? "yes" : "no"}
        onValueChange={(details) => onChange(details.value === "yes")}
      >
        <StyledRadioGroupLabel>{label}</StyledRadioGroupLabel>
        {["yes", "no"].map((option) => (
          <RadioGroupItem value={option} key={option}>
            <RadioGroupItemControl />
            <StyledRadioGroupItemText>
              {option === "yes" ? t("myNdla.quiz.form.settings.yes") : t("myNdla.quiz.form.settings.no")}
            </StyledRadioGroupItemText>
            <RadioGroupItemHiddenInput />
          </RadioGroupItem>
        ))}
      </RadioGroupRoot>
    </SettingRow>
  );
};

interface Props {
  state: QuizBuilderState;
  onChange: (state: QuizBuilderState) => void;
}

export const QuizSettingsTab = ({ state, onChange }: Props) => {
  const { randomSubset, randomOrder, alternativesRandomOrder, questionCount } = state;
  const totalQuestions = state.questions.length;
  const { t } = useTranslation();
  const [subsetError, setSubsetError] = useState(false);

  return (
    <Panel>
      <Section>
        <StyledHeading asChild consumeCss>
          <h2>{t("myNdla.quiz.form.settingsTab.title")}</h2>
        </StyledHeading>
        <Text textStyle="body.medium">{t("myNdla.quiz.form.settingsTab.description")}</Text>
      </Section>
      <Separator aria-hidden={true} />
      <Section>
        <StyledSectionHeading asChild consumeCss>
          <h3>{t("myNdla.quiz.form.settingsTab.randomOrderHeading")}</h3>
        </StyledSectionHeading>
        <SettingsGrid>
          <YesNoSetting
            label={t("myNdla.quiz.form.settingsTab.alternativesRandomOrder")}
            value={alternativesRandomOrder}
            onChange={(value) => onChange({ ...state, alternativesRandomOrder: value })}
          />
          <YesNoSetting
            label={t("myNdla.quiz.form.settingsTab.randomOrder")}
            value={randomOrder}
            onChange={(value) => onChange({ ...state, randomOrder: value })}
          />
        </SettingsGrid>
      </Section>
      <Separator aria-hidden={true} />
      <Section>
        <StyledSectionHeading asChild consumeCss>
          <h3>{t("myNdla.quiz.form.settingsTab.randomSubsetHeading")}</h3>
        </StyledSectionHeading>
        <SettingsGrid>
          <SettingRow>
            <YesNoSetting
              label={t("myNdla.quiz.form.settingsTab.randomSubset")}
              value={randomSubset}
              onChange={(wantsSubset) => {
                if (wantsSubset && totalQuestions < MIN_QUESTIONS_FOR_RANDOM_SUBSET) {
                  setSubsetError(true);
                  return;
                }
                setSubsetError(false);
                onChange({ ...state, randomSubset: wantsSubset });
              }}
            />
            {!!subsetError && (
              <Text textStyle="label.small" color="text.error" role="alert">
                {t("myNdla.quiz.form.settingsTab.randomSubsetMinQuestions")}
              </Text>
            )}
          </SettingRow>
          {!!randomSubset && (
            <SettingRow>
              <RadioGroupRoot
                orientation="vertical"
                value={String(questionCount)}
                onValueChange={(details) =>
                  onChange({
                    ...state,
                    questionCount: Number(details.value) as QuestionCountOption,
                  })
                }
              >
                <StyledRadioGroupLabel>{t("myNdla.quiz.form.settingsTab.questionCount")}</StyledRadioGroupLabel>
                <RadioRow>
                  {QUESTION_COUNT_OPTIONS.map((count) => (
                    <RadioGroupItem value={String(count)} key={count}>
                      <RadioGroupItemControl />
                      <StyledRadioGroupItemText>{count}</StyledRadioGroupItemText>
                      <RadioGroupItemHiddenInput />
                    </RadioGroupItem>
                  ))}
                </RadioRow>
              </RadioGroupRoot>
            </SettingRow>
          )}
        </SettingsGrid>
      </Section>
    </Panel>
  );
};
