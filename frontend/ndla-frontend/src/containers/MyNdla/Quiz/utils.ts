/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "../../../config";
import type { GQLQuizFragment } from "../../../graphqlTypes";
import { routes } from "../../../routeHelpers";

export const sharedQuizLink = (id: string, language?: string) => {
  const languageParam = language ? `/${language}` : "";
  return `${config.ndlaFrontendDomain}${languageParam}${routes.quiz(id)}`;
};

export const copyQuizSharingLink = (id: string, language?: string) =>
  window.navigator.clipboard.writeText(sharedQuizLink(id, language));

export const QUIZ_PRIVATE = "PRIVATE";
export const QUIZ_PUBLIC = "PUBLIC";

export const isQuizComplete = (quiz: GQLQuizFragment) =>
  !!quiz.questions.length &&
  quiz.questions.every((question) => question.alternatives.some((alt) => alt.text.trim() && alt.isCorrect));

const BASE_SECONDS_PER_QUESTION = 15;
const SECONDS_PER_ALTERNATIVE = 5;

export const estimateQuizMinutes = (quiz: GQLQuizFragment): number => {
  const { questions, randomSubset, questionCount } = quiz;
  if (questions.length === 0) return 0;

  const totalSeconds = questions.reduce(
    (sum, question) => sum + BASE_SECONDS_PER_QUESTION + question.alternatives.length * SECONDS_PER_ALTERNATIVE,
    0,
  );
  const averageSecondsPerQuestion = totalSeconds / questions.length;
  const effectiveQuestionCount =
    randomSubset && questionCount ? Math.min(questionCount, questions.length) : questions.length;

  return Math.max(1, Math.ceil((averageSecondsPerQuestion * effectiveQuestionCount) / 60));
};
