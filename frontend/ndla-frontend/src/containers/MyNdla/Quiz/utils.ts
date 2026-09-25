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

export const isQuizComplete = (quiz: GQLQuizFragment) =>
  !!quiz.questions.length &&
  quiz.questions.every((question) => question.alternatives.some((alt) => alt.text.trim() && alt.isCorrect));

const BASE_SECONDS_PER_QUESTION = 15;
const SECONDS_PER_ALTERNATIVE = 5;

export const estimateQuizMinutes = (quiz: GQLQuizFragment): number => {
  const { questions, displaySettings } = quiz;
  const { randomSubset, questionCount } = displaySettings;
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

type QuizQuestion = GQLQuizFragment["questions"][number];

const shuffle = <T>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
};

export const buildQuizSession = (quiz: GQLQuizFragment): QuizQuestion[] => {
  const { questions, displaySettings } = quiz;
  const { randomSubset, randomOrder, questionCount } = displaySettings;

  let selected = questions;
  if (randomSubset && questionCount) {
    const count = Math.min(questionCount, questions.length);
    selected = shuffle(questions).slice(0, count);
    if (!randomOrder) {
      const originalIndex = new Map(questions.map((question, index) => [question.id, index]));
      selected = [...selected].sort((a, b) => originalIndex.get(a.id)! - originalIndex.get(b.id)!);
    }
  } else if (randomOrder) {
    selected = shuffle(questions);
  }

  return selected.map((question) =>
    question.alternativesRandomOrder ? { ...question, alternatives: shuffle(question.alternatives) } : question,
  );
};
