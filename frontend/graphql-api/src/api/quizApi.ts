/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS, resolveOATS } from "@ndla/api-client";
import type { paths, QuizDTO, QuizResultDTO, QuizSearchResultDTO } from "@ndla/types-backend/myndla-api";
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
import { createAuthClient } from "../utils/openapi-fetch/utils";

const client = createAuthClient<paths>({ disableCache: true });

export async function fetchQuizzes(
  { page, pageSize }: GQLQueryQuizzesArgs,
  _context: Context,
): Promise<QuizSearchResultDTO> {
  return client
    .GET("/myndla-api/v1/quiz", {
      params: {
        query: {
          page,
          pageSize,
        },
      },
    })
    .then(resolveJsonOATS);
}

export async function fetchQuiz({ id }: GQLQueryQuizArgs, _context: Context): Promise<QuizDTO> {
  return client
    .GET("/myndla-api/v1/quiz/{quiz-id}", {
      params: { path: { "quiz-id": id } },
    })
    .then(resolveJsonOATS);
}

export async function postQuiz(
  { title, description, displaySettings }: GQLMutationAddQuizArgs,
  _context: Context,
): Promise<QuizDTO> {
  return client
    .POST("/myndla-api/v1/quiz", {
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
    })
    .then(resolveJsonOATS);
}

export async function putQuiz(
  { id, revision, title, description, displaySettings }: GQLMutationUpdateQuizArgs,
  _context: Context,
): Promise<QuizDTO> {
  return client
    .PUT("/myndla-api/v1/quiz/{quiz-id}", {
      params: { path: { "quiz-id": id } },
      body: {
        revision,
        title,
        description,
        displaySettings,
      },
    })
    .then(resolveJsonOATS);
}

export async function putQuizStatus(
  { id, status }: GQLMutationUpdateQuizStatusArgs,
  _context: Context,
): Promise<QuizDTO> {
  return client
    .PUT("/myndla-api/v1/quiz/{quiz-id}/status/{status}", {
      params: { path: { "quiz-id": id, status } },
    })
    .then(resolveJsonOATS);
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
  return client
    .PUT("/myndla-api/v1/quiz/{quiz-id}/questions/{question-id}", {
      params: { path: { "quiz-id": quizId, "question-id": questionId } },
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
    })
    .then(resolveJsonOATS);
}

export async function deleteQuizQuestion(
  { quizId, questionId }: GQLMutationDeleteQuizQuestionArgs,
  _context: Context,
): Promise<QuizDTO> {
  return client
    .DELETE("/myndla-api/v1/quiz/{quiz-id}/questions/{question-id}", {
      params: { path: { "quiz-id": quizId, "question-id": questionId } },
    })
    .then(resolveJsonOATS);
}

export async function postQuizQuestion(
  { quizId, questionType, title, alternatives, required, alternativesRandomOrder }: GQLMutationAddQuizQuestionArgs,
  _context: Context,
): Promise<QuizDTO> {
  return client
    .POST("/myndla-api/v1/quiz/{quiz-id}/questions", {
      params: { path: { "quiz-id": quizId } },
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
    })
    .then(resolveJsonOATS);
}

export async function deleteQuiz({ id }: GQLMutationDeleteQuizArgs, _context: Context): Promise<string> {
  await client
    .DELETE("/myndla-api/v1/quiz/{quiz-id}", {
      params: { path: { "quiz-id": id } },
    })
    .then(resolveOATS);
  return id;
}

export async function checkQuiz(
  { quizId, answers }: GQLMutationCheckQuizArgs,
  _context: Context,
): Promise<QuizResultDTO> {
  return client
    .POST("/myndla-api/v1/quiz/{quiz-id}/check-quiz", {
      params: { path: { "quiz-id": quizId } },
      body: {
        answers: answers.map((answer) => ({
          questionId: answer.questionId,
          selectedAlternativeIds: answer.selectedAlternativeIds,
          matchedPairs: [],
        })),
      },
    })
    .then(resolveJsonOATS);
}
