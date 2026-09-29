/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GQLQuizFragment } from "../../../../graphqlTypes";
import type { QuestionFormValues } from "./QuestionCard";
import type { QuestionCountOption, QuizBuilderState } from "./QuizBuilder";

export const QUESTION_COUNT_OPTIONS: QuestionCountOption[] = [5, 10, 15, 20];

export const hasCorrectAnswer = (question: QuestionFormValues) =>
  question.alternatives.some((alt) => alt.text.trim() && alt.isCorrect);

export const isQuizFormComplete = (questions: QuestionFormValues[]) => {
  const titledQuestions = questions.filter((question) => question.title.trim());
  return !!titledQuestions.length && titledQuestions.every(hasCorrectAnswer);
};

export const questionEquals = (a: QuestionFormValues, b: QuestionFormValues) =>
  a.title === b.title &&
  a.questionType === b.questionType &&
  a.required === b.required &&
  a.alternativesRandomOrder === b.alternativesRandomOrder &&
  a.alternatives.length === b.alternatives.length &&
  a.alternatives.every(
    (alt, i) => alt.text === b.alternatives[i]?.text && alt.isCorrect === b.alternatives[i]?.isCorrect,
  );

export const emptyQuestion = (): QuestionFormValues => ({
  id: crypto.randomUUID(),
  title: "",
  questionType: "SINGLE_CHOICE",
  required: false,
  alternativesRandomOrder: false,
  alternatives: [
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
  ],
});

export const emptyQuizState = (): QuizBuilderState => ({
  title: "",
  description: "",
  randomSubset: false,
  randomOrder: false,
  questionCount: 10,
  questions: [emptyQuestion()],
});

const toQuestionCountOption = (questionCount: number | null | undefined): QuestionCountOption => {
  const option = QUESTION_COUNT_OPTIONS.find((o) => o === questionCount);
  return option ?? 10;
};

export const quizToState = (quiz: GQLQuizFragment): QuizBuilderState => ({
  title: quiz.title,
  description: quiz.description ?? "",
  randomSubset: quiz.displaySettings.randomSubset,
  randomOrder: quiz.displaySettings.randomOrder,
  questionCount: toQuestionCountOption(quiz.displaySettings.questionCount),
  questions: quiz.questions.map((question) => ({
    id: crypto.randomUUID(),
    serverId: question.id,
    title: question.title,
    questionType: question.questionType === "MULTI_CHOICE" ? "MULTI_CHOICE" : "SINGLE_CHOICE",
    required: question.required,
    alternativesRandomOrder: question.alternativesRandomOrder,
    alternatives: question.alternatives.map((alt) => ({
      id: crypto.randomUUID(),
      text: alt.text,
      isCorrect: !!alt.isCorrect,
    })),
  })),
});
