/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowRightLine } from "@ndla/icons";
import {
  Button,
  CheckboxHiddenInput,
  CheckboxRoot,
  Heading,
  RadioGroupItem,
  RadioGroupItemHiddenInput,
  RadioGroupRoot,
  Text,
} from "@ndla/primitives";
import { css } from "@ndla/styled-system/css";
import { styled } from "@ndla/styled-system/jsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SKIP_TO_CONTENT_ID } from "../../../constants";
import type { GQLQuizFragment } from "../../../graphqlTypes";

type QuizQuestion = GQLQuizFragment["questions"][number];

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    width: "100%",
    maxWidth: "surface.pageMax",
  },
});

const QuizTitle = styled(Heading, {
  base: {
    textAlign: "center",
  },
});

const ProgressRow = styled("div", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
});

const QuestionCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    width: "100%",
    desktop: {
      padding: "medium",
      backgroundColor: "background.default",
      boxShadow: "xsmall",
    },
  },
});

const AlternativesList = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const AlternativeLetter = styled(Text, {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    borderRadius: "50%",
    width: "large",
    height: "large",
    backgroundColor: "surface.brand.1.subtle",
    color: "text.strong",
  },
  variants: {
    multiChoice: {
      true: {
        borderRadius: "small",
      },
    },
  },
});

const selectableAlternativeStyle = css.raw({
  width: "100%",
  gap: "xsmall",
  padding: "xsmall",
  borderRadius: "xsmall",
  border: "1px solid",
  borderColor: "stroke.default",
  backgroundColor: "background.default",
  cursor: "pointer",
  transitionDuration: "normal",
  transitionProperty: "background-color, border-color",
  _hover: {
    backgroundColor: "surface.brand.1.subtle",
    borderColor: "stroke.hover",
  },
  _checked: {
    backgroundColor: "surface.brand.1.moderate",
    borderColor: "surface.brand.1.strong",
  },
  "&:has(input:focus-visible)": {
    outline: "2px solid",
    outlineOffset: "2px",
    outlineColor: "stroke.default",
  },
});

const AlternativeRadioItem = styled(RadioGroupItem, {
  base: selectableAlternativeStyle,
});

const AlternativeCheckboxRoot = styled(CheckboxRoot, {
  base: selectableAlternativeStyle,
});

const NavigationRow = styled("div", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
});

interface Props {
  quizTitle: string;
  question: QuizQuestion;
  questionNumber: number;
  questionCount: number;
  initialAnswerIds?: string[];
  onBack?: (answerIds: string[]) => void;
  onNext: (answerIds: string[]) => void;
  isLast: boolean;
  finishing?: boolean;
}

export const QuizQuestionScreen = ({
  quizTitle,
  question,
  questionNumber,
  questionCount,
  initialAnswerIds,
  onBack,
  onNext,
  isLast,
  finishing,
}: Props) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialAnswerIds ?? [],
  );
  const [showError, setShowError] = useState(false);

  const isMultiChoice = question.questionType === "MULTI_CHOICE";
  const percent = Math.round((questionNumber / questionCount) * 100);

  const onCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id),
    );
    setShowError(false);
  };

  const onNextClick = () => {
    if (!selectedIds.length) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onNext(selectedIds);
  };

  return (
    <Wrapper>
      <QuestionCard>
        <QuizTitle textStyle="title.small" id={SKIP_TO_CONTENT_ID}>
          {quizTitle}
        </QuizTitle>
        <ProgressRow>
          <Text textStyle="label.xsmall" fontWeight="bold" color="text.subtle">
            {t("myNdla.quiz.take.questionProgress", {
              current: questionNumber,
              total: questionCount,
            })}
          </Text>
          <Text textStyle="label.xsmall" color="text.subtle">
            {t("myNdla.quiz.take.percentComplete", { percent })}
          </Text>
        </ProgressRow>
        <Heading textStyle="title.medium">{question.title}</Heading>
        <Text textStyle="label.small" color="text.subtle">
          {t(
            isMultiChoice
              ? "myNdla.quiz.take.multipleChoiceHint"
              : "myNdla.quiz.take.singleChoiceHint",
          )}
        </Text>
        <AlternativesList>
          {isMultiChoice ? (
            question.alternatives.map((alt, index) => (
              <AlternativeCheckboxRoot
                key={alt.id}
                checked={selectedIds.includes(alt.id)}
                onCheckedChange={(details) =>
                  onCheckboxChange(alt.id, !!details.checked)
                }
              >
                <AlternativeLetter
                  multiChoice
                  textStyle="label.small"
                  fontWeight="bold"
                  asChild
                  consumeCss
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                </AlternativeLetter>
                <Text textStyle="label.medium">{alt.text}</Text>
                <CheckboxHiddenInput />
              </AlternativeCheckboxRoot>
            ))
          ) : (
            <RadioGroupRoot
              value={selectedIds[0] ?? null}
              onValueChange={(details) => {
                setSelectedIds(details.value ? [details.value] : []);
                setShowError(false);
              }}
            >
              {question.alternatives.map((alt, index) => (
                <AlternativeRadioItem key={alt.id} value={alt.id}>
                  <AlternativeLetter
                    textStyle="label.small"
                    fontWeight="bold"
                    asChild
                    consumeCss
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                  </AlternativeLetter>
                  <Text textStyle="label.medium">{alt.text}</Text>
                  <RadioGroupItemHiddenInput />
                </AlternativeRadioItem>
              ))}
            </RadioGroupRoot>
          )}
        </AlternativesList>
        {!!showError && (
          <Text textStyle="label.small" color="text.error">
            {t(
              isMultiChoice
                ? "myNdla.quiz.take.selectAnswerErrorMulti"
                : "myNdla.quiz.take.selectAnswerError",
            )}
          </Text>
        )}
      </QuestionCard>
      <NavigationRow>
        {!!onBack && (
          <Button variant="tertiary" onClick={() => onBack(selectedIds)}>
            {t("myNdla.quiz.take.back")}
          </Button>
        )}
        <Button
          onClick={onNextClick}
          css={{ marginInlineStart: "auto" }}
          loading={isLast ? !!finishing : false}
        >
          {t(isLast ? "myNdla.quiz.take.finish" : "myNdla.quiz.take.next")}
          <ArrowRightLine />
        </Button>
      </NavigationRow>
    </Wrapper>
  );
};
