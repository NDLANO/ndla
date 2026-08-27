/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CheckLine } from "@ndla/icons";
import { Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { routes } from "../../../../routeHelpers";

const StepWrapper = styled("ol", {
  base: {
    display: "flex",
    listStyle: "none",
    gap: "4xsmall",
    "& a": {
      color: "text.strong",
    },
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    borderColor: "stroke.default",
    border: "1px solid",
    width: "xxlarge",
    height: "xxlarge",
    textAlign: "center",
    _selected: {
      backgroundColor: "surface.brand.1",
      borderColor: "surface.brand.1",
    },
  },
  variants: {
    done: {
      true: {
        backgroundColor: "surface.success",
        borderColor: "surface.success",
        color: "text.onAction",
      },
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

const StyledSafeLink = styled(SafeLink, {
  base: {
    textDecoration: "underline",
    _hover: {
      textDecoration: "none",
    },
    _selected: {
      textDecoration: "none",
    },
  },
});

const STEPS = ["build", "review", "save"] as const;
type Step = (typeof STEPS)[number];

interface Props {
  step: Step;
  quizId?: string;
}

const PATH_MAPPING: Partial<Record<Step, (quizId: string) => string>> = {
  build: routes.myNdla.quizEdit,
  review: routes.myNdla.quizReview,
  save: routes.myNdla.quizSave,
};

export const QuizStepper = ({ step, quizId }: Props) => {
  const { t } = useTranslation();
  const currentIndex = STEPS.indexOf(step);

  return (
    <nav aria-label={t("myNdla.quiz.form.navigation")}>
      <StepWrapper>
        {STEPS.map((key, idx) => {
          const isDone = quizId != null && idx < currentIndex;
          const to = quizId ? PATH_MAPPING[key]?.(quizId) : undefined;

          return (
            <Step key={key}>
              <NumberText aria-selected={step === key} done={isDone}>
                {isDone ? <CheckLine /> : <span>{idx + 1}</span>}
              </NumberText>
              {to ? (
                <StyledSafeLink aria-label={t(`myNdla.quiz.form.steps.${key}`)} aria-selected={step === key} to={to}>
                  {t(`myNdla.quiz.form.steps.${key}`)}
                </StyledSafeLink>
              ) : (
                <Text aria-selected={step === key}>{t(`myNdla.quiz.form.steps.${key}`)}</Text>
              )}
              <Line />
            </Step>
          );
        })}
      </StepWrapper>
    </nav>
  );
};
