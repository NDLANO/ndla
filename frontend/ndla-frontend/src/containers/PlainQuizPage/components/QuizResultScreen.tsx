/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowDownShortLine, CheckLine, CloseLine, SubtractLine } from "@ndla/icons";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemIndicator,
  AccordionItemTrigger,
  AccordionRoot,
  Button,
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxIndicator,
  CheckboxRoot,
  Heading,
  MessageBox,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { QUIZ_NEUTER_ONE, QUIZ_NUMBER_WORDS } from "../../../constants";
import type { GQLCheckQuizMutation, GQLQuizFragment } from "../../../graphqlTypes";
import type { LocaleType } from "../../../interfaces";
import { HurraAnimation, KvissAnimation, VisskAnimation } from "./animations/QuizResultAnimation";

type QuizQuestion = GQLQuizFragment["questions"][number];
type QuestionResult = GQLCheckQuizMutation["checkQuiz"]["results"][number];

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "medium",
    width: "100%",
    maxWidth: "surface.pageMax",
    textAlign: "center",
  },
});

const ResultPanel = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "small",
    width: "100%",
    desktop: {
      padding: "xlarge",
      backgroundColor: "background.default",
      boxShadow: "xsmall",
    },
  },
  variants: {
    overflow: {
      hidden: {
        overflow: "hidden",
      },
    },
  },
});

const ResultSummary = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "medium",
    width: "100%",
    maxWidth: "surface.pageMax",
    textAlign: "center",
    padding: "xlarge",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
  },
  variants: {
    overflow: {
      hidden: {
        overflow: "hidden",
      },
    },
  },
});

const ScorePill = styled(Text, {
  base: {
    paddingBlock: "xsmall",
    paddingInline: "medium",
    borderRadius: "large",
    backgroundColor: "surface.brand.1.moderate",
  },
});

const ScorePillCorrect = styled("span", {
  base: {
    fontWeight: "bold",
    color: "text.strong",
  },
});

const ScorePillTotal = styled("span", {
  base: {
    fontWeight: "light",
    color: "#706F8A",
  },
});

const SummaryRoot = styled(AccordionRoot, {
  base: {
    width: "100%",
    textAlign: "start",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
  },
});

const QuestionResultRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3xsmall",
    padding: "small",
  },
});

const QuestionResultHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "flex-start",
    gap: "xsmall",
  },
});

const StatusIcon = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "medium",
    height: "medium",
    borderRadius: "50%",
  },
  variants: {
    status: {
      correct: {
        backgroundColor: "surface.successSubtle",
        color: "surface.brand.3.strong",
      },
      incorrect: {
        backgroundColor: "surface.errorSubtle",
        color: "primary",
      },
      partial: {
        backgroundColor: "#FFF9E5",
        color: "icon.default",
      },
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

const AlternativeRow = styled(CheckboxRoot, {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "xsmall",
    width: "100%",
    padding: "xsmall",
    borderRadius: "xsmall",
    border: "1px solid",
    borderColor: "stroke.subtle",
    backgroundColor: "background.default",
    boxShadow: "xsmall",
  },
});

const AlternativeText = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
  },
});

const numberToWord = (locale: LocaleType, form: "common" | "neuter", count: number): string =>
  form === "neuter" && count === 1 ? QUIZ_NEUTER_ONE[locale] : (QUIZ_NUMBER_WORDS[locale][count] ?? String(count));

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

type QuestionStatus = "correct" | "incorrect" | "partial";

const getQuestionStatus = (
  questionResult: QuestionResult,
  isMultiChoice: boolean,
  answerIds: string[],
): QuestionStatus => {
  if (questionResult.isCorrect) return "correct";
  if (!isMultiChoice) return "incorrect";
  const correctIds = new Set(questionResult.correctAlternativeIds);
  const selectedSomeCorrect = answerIds.some((id) => correctIds.has(id));
  return selectedSomeCorrect ? "partial" : "incorrect";
};

interface Props {
  quizTitle: string;
  session: QuizQuestion[];
  answers: Record<string, string[]>;
  result: GQLCheckQuizMutation["checkQuiz"];
  onRetry: () => void;
}

type ScoreTier = "perfect" | "good" | "poor";

const getScoreTier = (correctCount: number, total: number): ScoreTier => {
  if (total > 0 && correctCount === total) return "perfect";
  if (total > 0 && correctCount / total > 1 / 3) return "good";
  return "poor";
};

const RESULT_ANIMATION: Record<ScoreTier, () => ReactElement> = {
  perfect: HurraAnimation,
  good: KvissAnimation,
  poor: VisskAnimation,
};

const RESULT_HEADING_KEY = {
  perfect: "myNdla.quiz.take.result.headingPerfect",
  good: "myNdla.quiz.take.result.heading",
  poor: "myNdla.quiz.take.result.headingLow",
} as const satisfies Record<ScoreTier, string>;

export const QuizResultScreen = ({ session, answers, result, onRetry }: Props) => {
  const { t } = useTranslation();
  const correctCount = result.results.filter((questionResult) => questionResult.isCorrect).length;
  const total = result.results.length;
  const scoreTier = getScoreTier(correctCount, total);
  const ResultAnimation = RESULT_ANIMATION[scoreTier];

  return (
    <Wrapper>
      <ResultPanel overflow={scoreTier === "perfect" ? "hidden" : undefined}>
        <ResultSummary overflow={scoreTier === "good" ? "hidden" : undefined}>
          <ResultAnimation />
          <Heading textStyle="title.large" fontWeight="bold">
            {t(RESULT_HEADING_KEY[scoreTier])}
          </Heading>
          <Text>{t("myNdla.quiz.take.result.score", { correct: correctCount, total })}</Text>
          <ScorePill textStyle="body.xlarge">
            <ScorePillCorrect>{correctCount}</ScorePillCorrect>
            <ScorePillTotal>{t("myNdla.quiz.take.result.scorePillTotal", { total })}</ScorePillTotal>
          </ScorePill>
        </ResultSummary>
        <Button variant="tertiary" onClick={onRetry}>
          {t("myNdla.quiz.take.result.retry")}
        </Button>
      </ResultPanel>
      <SummaryRoot multiple>
        <AccordionItem value="summary">
          <Heading asChild consumeCss textStyle="label.medium" fontWeight="bold">
            <h2>
              <AccordionItemTrigger>
                {t("myNdla.quiz.take.result.summaryTitle")}
                <AccordionItemIndicator asChild>
                  <ArrowDownShortLine />
                </AccordionItemIndicator>
              </AccordionItemTrigger>
            </h2>
          </Heading>
          <AccordionItemContent>
            {session.map((question) => {
              const questionResult = result.results.find((r) => r.questionId === question.id);
              if (!questionResult) return null;
              const isMultiChoice = question.questionType === "MULTI_CHOICE";
              const status = getQuestionStatus(questionResult, isMultiChoice, answers[question.id] ?? []);
              return (
                <QuestionResultRow key={question.id}>
                  <QuestionResultHeader>
                    <StatusIcon status={status}>
                      {status === "correct" ? (
                        <CheckLine size="small" />
                      ) : status === "incorrect" ? (
                        <CloseLine size="small" />
                      ) : (
                        <SubtractLine size="small" />
                      )}
                    </StatusIcon>
                    <div>
                      <Text textStyle="label.medium" fontWeight="bold">
                        {question.title}
                      </Text>
                      {isMultiChoice ? (
                        <Text textStyle="label.small" color="text.subtle">
                          {t("myNdla.quiz.take.multipleChoiceHint")}
                        </Text>
                      ) : (
                        <QuestionAnswerText
                          question={question}
                          answerIds={answers[question.id] ?? []}
                          questionResult={questionResult}
                        />
                      )}
                    </div>
                  </QuestionResultHeader>
                  {!!isMultiChoice && (
                    <MultiChoiceBreakdown
                      question={question}
                      answerIds={answers[question.id] ?? []}
                      questionResult={questionResult}
                    />
                  )}
                </QuestionResultRow>
              );
            })}
          </AccordionItemContent>
        </AccordionItem>
      </SummaryRoot>
    </Wrapper>
  );
};

const QuestionAnswerText = ({
  question,
  answerIds,
  questionResult,
}: {
  question: QuizQuestion;
  answerIds: string[];
  questionResult: QuestionResult;
}) => {
  const { t } = useTranslation();
  const answerText = question.alternatives.find((alt) => alt.id === answerIds[0])?.text;
  const correctText = question.alternatives.find((alt) => alt.id === questionResult.correctAlternativeIds[0])?.text;

  return (
    <>
      <Text textStyle="label.small" color="text.subtle">
        {answerText}
      </Text>
      {!questionResult.isCorrect && !!correctText && (
        <Text textStyle="label.small" fontWeight="bold">
          {t("myNdla.quiz.take.result.correctAnswer", { answer: correctText })}
        </Text>
      )}
    </>
  );
};

const MultiChoiceBreakdown = ({
  question,
  answerIds,
  questionResult,
}: {
  question: QuizQuestion;
  answerIds: string[];
  questionResult: QuestionResult;
}) => {
  const { t, i18n } = useTranslation();
  const correctIds = new Set(questionResult.correctAlternativeIds);
  const selectedIds = new Set(answerIds);

  const selectedCorrect = answerIds.filter((id) => correctIds.has(id)).length;
  const selectedIncorrect = answerIds.filter((id) => !correctIds.has(id)).length;
  const missing = correctIds.size - selectedCorrect;
  const isAllCorrect = questionResult.isCorrect;
  const isAllIncorrect = !isAllCorrect && selectedCorrect === 0 && selectedIncorrect > 0;
  const isPartial = !isAllCorrect && !isAllIncorrect && (selectedCorrect > 0 || selectedIncorrect > 0);

  return (
    <>
      <AlternativesList>
        {question.alternatives.map((alt) => {
          const isSelected = selectedIds.has(alt.id);
          const isCorrectAlt = correctIds.has(alt.id);
          const isRight = isSelected === isCorrectAlt;
          const subtitleKey = isSelected
            ? isCorrectAlt
              ? "myNdla.quiz.take.result.yourAnswerCorrect"
              : "myNdla.quiz.take.result.yourAnswerIncorrect"
            : isCorrectAlt
              ? "myNdla.quiz.take.result.correctNotSelected"
              : "myNdla.quiz.take.result.notSelectedIncorrect";
          return (
            <AlternativeRow key={alt.id} checked={isSelected} readOnly>
              <CheckboxControl>
                <CheckboxIndicator asChild>
                  <CheckLine />
                </CheckboxIndicator>
              </CheckboxControl>
              <AlternativeText>
                <Text textStyle="body.small">{alt.text}</Text>
                <Text textStyle="label.xsmall" color="text.subtle">
                  {t(subtitleKey)}
                </Text>
              </AlternativeText>
              <StatusIcon status={isRight ? "correct" : "incorrect"} css={{ marginInlineStart: "auto" }}>
                {isRight ? <CheckLine size="small" /> : <CloseLine size="small" />}
              </StatusIcon>
              <CheckboxHiddenInput />
            </AlternativeRow>
          );
        })}
      </AlternativesList>
      {!!isAllCorrect && <MessageBox variant="success">{t("myNdla.quiz.take.result.allCorrectFeedback")}</MessageBox>}
      {!!isAllIncorrect && <MessageBox variant="error">{t("myNdla.quiz.take.result.allIncorrectFeedback")}</MessageBox>}
      {!!isPartial && (
        <MessageBox variant="warning">
          {t("myNdla.quiz.take.result.partialFeedback", {
            correct: numberToWord(i18n.language, "common", selectedCorrect),
            incorrect: numberToWord(i18n.language, "neuter", selectedIncorrect),
            missing: capitalize(numberToWord(i18n.language, "neuter", missing)),
          })}
        </MessageBox>
      )}
    </>
  );
};
