/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS, resolveOATS } from "@ndla/api-client";
import {
  deleteMyndlaApiV1QuizQuizId,
  deleteMyndlaApiV1QuizQuizIdQuestionsQuestionId,
  getMyndlaApiV1Quiz,
  getMyndlaApiV1QuizQuizId,
  postMyndlaApiV1Quiz,
  postMyndlaApiV1QuizQuizIdCheckQuiz,
  postMyndlaApiV1QuizQuizIdQuestions,
  putMyndlaApiV1QuizQuizId,
  putMyndlaApiV1QuizQuizIdQuestionsQuestionId,
  putMyndlaApiV1QuizQuizIdStatusStatus,
  type QuizDTO,
  type QuizResultDTO,
  type QuizSearchResultDTO,
} from "@ndla/types-backend/myndla-api";
import { createClient } from "@ndla/types-backend/myndla-api/client";
import type {
  GQLMutationAddQuizArgs,
  GQLMutationAddQuizQuestionArgs,
  GQLMutationCheckQuizArgs,
  GQLMutationDeleteQuizArgs,
  GQLMutationDeleteQuizQuestionArgs,
  GQLMutationUpdateQuizArgs,
  GQLMutationUpdateQuizQuestionArgs,
  GQLMutationUpdateQuizStatusArgs,
  GQLQueryQuizArgs,
  GQLQueryQuizzesArgs,
} from "../types/schema";
import { clientConfig } from "../utils/apiClient/clientConfig";

const client = createClient(clientConfig({ disableCache: true }));

export async function fetchQuizzes(
  { page, pageSize }: GQLQueryQuizzesArgs,
  _context: Context,
): Promise<QuizSearchResultDTO> {
  return getMyndlaApiV1Quiz({
    client,
    query: {
      page,
      pageSize,
    },
  }).then(resolveJsonOATS);
}

export async function fetchQuiz({ id }: GQLQueryQuizArgs, _context: Context): Promise<QuizDTO> {
  return getMyndlaApiV1QuizQuizId({ client, path: { "quiz-id": id } }).then(resolveJsonOATS);
}

export async function postQuiz(
  { title, description, displaySettings }: GQLMutationAddQuizArgs,
  _context: Context,
): Promise<QuizDTO> {
  return postMyndlaApiV1Quiz({
    client,
    body: {
      title,
      description,
      displaySettings: displaySettings
        ? {
            randomOrder: displaySettings.randomOrder ?? false,
            randomSubset: displaySettings.randomSubset ?? false,
            questionCount: displaySettings.questionCount,
          }
        : undefined,
    },
  }).then(resolveJsonOATS);
}

export async function putQuiz(
  { id, revision, title, description, displaySettings }: GQLMutationUpdateQuizArgs,
  _context: Context,
): Promise<QuizDTO> {
  return putMyndlaApiV1QuizQuizId({
    client,
    path: { "quiz-id": id },
    body: {
      revision,
      title,
      description,
      displaySettings,
    },
  }).then(resolveJsonOATS);
}

export async function putQuizStatus(
  { id, status }: GQLMutationUpdateQuizStatusArgs,
  _context: Context,
): Promise<QuizDTO> {
  return putMyndlaApiV1QuizQuizIdStatusStatus({ client, path: { "quiz-id": id, status } }).then(resolveJsonOATS);
}

export async function putQuizQuestion(
  {
    quizId,
    questionId,
    questionType,
    title,
    alternatives,
    required,
    alternativesRandomOrder,
  }: GQLMutationUpdateQuizQuestionArgs,
  _context: Context,
): Promise<QuizDTO> {
  return putMyndlaApiV1QuizQuizIdQuestionsQuestionId({
    client,
    path: { "quiz-id": quizId, "question-id": questionId },
    body: {
      questionType,
      title,
      alternatives: alternatives?.map((a) => ({
        text: a.text,
        isCorrect: a.isCorrect,
      })),
      glossaryPairs: undefined,
      required,
      alternativesRandomOrder,
    },
  }).then(resolveJsonOATS);
}

export async function deleteQuizQuestion(
  { quizId, questionId }: GQLMutationDeleteQuizQuestionArgs,
  _context: Context,
): Promise<QuizDTO> {
  return deleteMyndlaApiV1QuizQuizIdQuestionsQuestionId({
    client,
    path: { "quiz-id": quizId, "question-id": questionId },
  }).then(resolveJsonOATS);
}

export async function postQuizQuestion(
  { quizId, questionType, title, alternatives, required, alternativesRandomOrder }: GQLMutationAddQuizQuestionArgs,
  _context: Context,
): Promise<QuizDTO> {
  return postMyndlaApiV1QuizQuizIdQuestions({
    client,
    path: { "quiz-id": quizId },
    body: {
      questionType,
      title,
      alternatives: alternatives.map((a) => ({
        text: a.text,
        isCorrect: a.isCorrect,
      })),
      glossaryPairs: [],
      required: required ?? false,
      alternativesRandomOrder: alternativesRandomOrder ?? false,
    },
  }).then(resolveJsonOATS);
}

export async function deleteQuiz({ id }: GQLMutationDeleteQuizArgs, _context: Context): Promise<string> {
  await deleteMyndlaApiV1QuizQuizId({ client, path: { "quiz-id": id } }).then(resolveOATS);
  return id;
}

export async function checkQuiz(
  { quizId, answers }: GQLMutationCheckQuizArgs,
  _context: Context,
): Promise<QuizResultDTO> {
  return postMyndlaApiV1QuizQuizIdCheckQuiz({
    client,
    path: { "quiz-id": quizId },
    body: {
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        selectedAlternativeIds: answer.selectedAlternativeIds,
        matchedPairs: [],
      })),
    },
  }).then(resolveJsonOATS);
}
