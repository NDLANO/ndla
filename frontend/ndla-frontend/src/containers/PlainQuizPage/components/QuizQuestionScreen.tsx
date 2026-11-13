/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowRightLine, CheckLine } from "@ndla/icons";
import {
  Button,
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxIndicator,
  CheckboxRoot,
  Heading,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupRoot,
  Text,
} from "@ndla/primitives";
import { css } from "@ndla/styled-system/css";
import { styled } from "@ndla/styled-system/jsx";
import { type CSSProperties, type KeyboardEvent, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseSimpleRichText } from "../../../components/RichTextEditor/parseSimpleRichText";
import { SKIP_TO_CONTENT_ID } from "../../../constants";
import type { GQLQuizFragment } from "../../../graphqlTypes";

type QuizQuestion = GQLQuizFragment["questions"][number];

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    width: "full",
    maxWidth: "surface.pageMax",
  },
});

const QuizTitle = styled(Heading, {
  base: {
    textAlign: "center",
  },
});

const ProgressSection = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    width: "full",
    paddingBottom: "xxlarge",
  },
});

const ProgressContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxsmall",
    width: "full",
  },
});

const QuestionSection = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    width: "full",
  },
});

const ProgressRow = styled("div", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    width: "full",
  },
});

const ProgressTrack = styled("div", {
  base: {
    display: "flex",
    alignItems: "flex-start",
    alignSelf: "stretch",
    height: "xxsmall",
    borderRadius: "xsmall",
    backgroundColor: "surface.brand.1.moderate",
    overflow: "hidden",
  },
});

const ProgressFill = styled("div", {
  base: {
    height: "full",
    width: "var(--quiz-progress-to)",
    borderRadius: "[inherit]",
    backgroundColor: "primary",
    animation: "var(--animations-quiz-progress-fill)",
    _motionReduce: {
      animation: "[none]",
    },
  },
});

const StyledQuestionCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    width: "full",
    desktop: {
      padding: "medium",
      backgroundColor: "background.default",
      boxShadow: "xsmall",
      gap: "large",
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
    borderRadius: "half",
    width: "medium",
    height: "medium",
    backgroundColor: "surface.brand.1.moderate",
    color: "text.subtle",
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
  width: "full",
  gap: "xxsmall",
  justifyContent: "space-between",
  padding: "xsmall",
  borderRadius: "xsmall",
  border: "1px solid",
  borderColor: "stroke.subtle",
  backgroundColor: "background.default",
  cursor: "pointer",
  transitionDuration: "normal",
  transitionProperty: "[background-color, border-color]",
  _hover: {
    backgroundColor: "surface.action.brand.1.selected",
  },
  _checked: {
    backgroundColor: "surface.action.brand.1.selected",
  },
  _active: {
    backgroundColor: "surface.action.brand.1.selected",
  },
  "&:has(input:focus-visible)": {
    outline: "3px solid",
    outlineOffset: "[-1px]",
    outlineColor: "stroke.default",
  },
});

const AlternativeRadioItem = styled(RadioGroupItem, {
  base: selectableAlternativeStyle,
});

const AlternativeRadioControl = styled(RadioGroupItemControl, {
  base: {
    _groupActive: {
      background: "surface.action.brand.1.selected",
      outlineColor: "surface.action.brand.1.selected",
    },
    _groupChecked: {
      outlineColor: "surface.action.brand.1.selected",
    },
    _checked: {
      background: "stroke.default",
    },
  },
});

const AlternativeCheckboxRoot = styled(CheckboxRoot, {
  base: selectableAlternativeStyle,
});

const AlternativeContent = styled("span", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "xsmall",
  },
});

const NavigationRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    width: "full",
  },
});

interface AlternativeLabelProps {
  index: number;
  text: string;
  multiChoice?: boolean;
}

const AlternativeLabel = ({ index, text, multiChoice }: AlternativeLabelProps) => (
  <AlternativeContent>
    <AlternativeLetter multiChoice={multiChoice} textStyle="label.xsmall" fontWeight="bold" asChild consumeCss>
      <span>{String.fromCharCode(65 + index)}</span>
    </AlternativeLetter>
    <Text textStyle="label.small">{parseSimpleRichText(text)}</Text>
  </AlternativeContent>
);

interface Props {
  quizTitle: string;
  question: QuizQuestion;
  questionNumber: number;
  previousQuestionNumber: number;
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
  previousQuestionNumber,
  questionCount,
  initialAnswerIds,
  onBack,
  onNext,
  isLast,
  finishing,
}: Props) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialAnswerIds ?? []);
  const [showError, setShowError] = useState(false);

  const headingId = useId();
  const hintId = useId();
  const errorId = useId();

  const isMultiChoice = question.questionType === "MULTI_CHOICE";
  const alternativesLabelProps = {
    "aria-labelledby": headingId,
    "aria-describedby": showError ? `${hintId} ${errorId}` : hintId,
  };
  const progress = (questionNumber / questionCount) * 100;
  const percent = Math.round(progress);
  const progressStyle = {
    "--quiz-progress-from": `${(previousQuestionNumber / questionCount) * 100}%`,
    "--quiz-progress-to": `${progress}%`,
  } as CSSProperties;

  const onCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)));
    setShowError(false);
  };

  // Space is the native way to toggle radios and checkboxes. Many users expect Enter to work as well.
  const onAlternativeKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      event.target.click();
    }
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
      <StyledQuestionCard>
        <QuizTitle textStyle="title.small" id={SKIP_TO_CONTENT_ID}>
          {quizTitle}
        </QuizTitle>
        <ProgressSection>
          <ProgressContainer>
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
            <ProgressTrack aria-hidden>
              <ProgressFill style={progressStyle} />
            </ProgressTrack>
          </ProgressContainer>
          <QuestionSection>
            <Heading textStyle="title.medium" id={headingId}>
              {parseSimpleRichText(question.title)}
            </Heading>
            <Text textStyle="label.small" color="text.subtle" id={hintId}>
              {t(isMultiChoice ? "myNdla.quiz.take.multipleChoiceHint" : "myNdla.quiz.take.singleChoiceHint")}
            </Text>
          </QuestionSection>
          <AlternativesList
            role={isMultiChoice ? "group" : undefined}
            {...(isMultiChoice ? alternativesLabelProps : {})}
          >
            {isMultiChoice ? (
              question.alternatives.map((alt, index) => (
                <AlternativeCheckboxRoot
                  className="group"
                  key={alt.id}
                  checked={selectedIds.includes(alt.id)}
                  onCheckedChange={(details) => onCheckboxChange(alt.id, !!details.checked)}
                  onKeyDown={onAlternativeKeyDown}
                >
                  <AlternativeLabel index={index} text={alt.text} multiChoice />
                  <CheckboxControl>
                    <CheckboxIndicator asChild>
                      <CheckLine />
                    </CheckboxIndicator>
                  </CheckboxControl>
                  <CheckboxHiddenInput />
                </AlternativeCheckboxRoot>
              ))
            ) : (
              <RadioGroupRoot
                css={{ gap: "xsmall" }}
                {...alternativesLabelProps}
                value={selectedIds[0] ?? null}
                onValueChange={(details) => {
                  setSelectedIds(details.value ? [details.value] : []);
                  setShowError(false);
                }}
              >
                {question.alternatives.map((alt, index) => (
                  <AlternativeRadioItem className="group" key={alt.id} value={alt.id} onKeyDown={onAlternativeKeyDown}>
                    <AlternativeLabel index={index} text={alt.text} />
                    <AlternativeRadioControl />
                    <RadioGroupItemHiddenInput />
                  </AlternativeRadioItem>
                ))}
              </RadioGroupRoot>
            )}
          </AlternativesList>
          {!!showError && (
            <Text textStyle="label.small" color="text.error" id={errorId} role="alert">
              {t(isMultiChoice ? "myNdla.quiz.take.selectAnswerErrorMulti" : "myNdla.quiz.take.selectAnswerError")}
            </Text>
          )}
        </ProgressSection>
        <NavigationRow>
          <Button onClick={onNextClick} loading={isLast ? !!finishing : false}>
            {t(isLast ? "myNdla.quiz.take.finish" : "myNdla.quiz.take.next")}
            <ArrowRightLine />
          </Button>
          {!!onBack && (
            <Button variant="tertiary" onClick={() => onBack(selectedIds)}>
              {t("myNdla.quiz.take.back")}
            </Button>
          )}
        </NavigationRow>
      </StyledQuestionCard>
    </Wrapper>
  );
};
