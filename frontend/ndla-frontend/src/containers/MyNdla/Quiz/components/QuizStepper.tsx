/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";

const StepWrapper = styled("ol", {
  base: {
    display: "flex",
    listStyle: "none",
    gap: "4xsmall",
    mobileWideDown: {
      display: "none",
    },
  },
});

const Step = styled("li", {
  base: {
    display: "flex",
    gap: "4xsmall",
    alignItems: "center",
    _last: {
      "& div": {
        display: "none",
      },
    },
  },
});

const NumberText = styled(Text, {
  base: {
    borderRadius: "50%",
    borderColor: "stroke.default",
    border: "1px solid",
    paddingInline: "3xsmall",
    width: "2.5ch",
    textAlign: "center",
    _selected: {
      backgroundColor: "surface.brand.1",
    },
  },
});

const Line = styled("div", {
  base: {
    display: "block",
    borderStyle: "inset",
    borderBlockEnd: "1px solid",
    width: "xsmall",
    borderColor: "icon.strong",
    justifyContent: "center",
    alignItems: "center",
  },
});

const STEPS = ["build", "save"] as const;
type Step = (typeof STEPS)[number];

interface Props {
  step: Step;
}

export const QuizStepper = ({ step }: Props) => {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("myNdla.quiz.form.navigation")}>
      <StepWrapper>
        {STEPS.map((key, idx) => (
          <Step key={key}>
            <NumberText aria-selected={step === key}>
              <span>{idx + 1}</span>
            </NumberText>
            <Text aria-selected={step === key}>{t(`myNdla.quiz.form.steps.${key}`)}</Text>
            <Line />
          </Step>
        ))}
      </StepWrapper>
    </nav>
  );
};
