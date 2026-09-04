/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { paths, QuestionType, QuizDTO, QuizSearchResultDTO, QuizStatus } from "@ndla/types-backend/myndla-api";
import type {
  GQLMutationAddQuizArgs,
  GQLMutationAddQuizQuestionArgs,
  GQLMutationDeleteQuizArgs,
  GQLMutationDeleteQuizQuestionArgs,
  GQLMutationUpdateQuizArgs,
  GQLMutationUpdateQuizQuestionArgs,
  GQLMutationUpdateQuizStatusArgs,
  GQLQueryQuizArgs,
  GQLQueryQuizzesArgs,
} from "../types/schema";
import { createAuthClient, resolveJsonOATS } from "../utils/openapi-fetch/utils";

const client = createAuthClient<paths>({ disableCache: true });

export async function fetchQuizzes(
  { page, pageSize }: GQLQueryQuizzesArgs,
  _context: Context,
): Promise<QuizSearchResultDTO> {
  return client
    .GET("/myndla-api/v1/quiz", {
      params: {
        query: {
          page: page ?? undefined,
          pageSize: pageSize ?? undefined,
        },
      },
    })
    .then(resolveJsonOATS);
}

export async function fetchQuiz({ id }: GQLQueryQuizArgs, _context: Context): Promise<QuizDTO> {
  return client.GET("/myndla-api/v1/quiz/{quiz-id}", { params: { path: { "quiz-id": id } } }).then(resolveJsonOATS);
}

export async function postQuiz(
  { title, description, randomSubset, questionCount }: GQLMutationAddQuizArgs,
  _context: Context,
): Promise<QuizDTO> {
  const hasDisplaySettings = randomSubset != null || questionCount != null;
  return client
    .POST("/myndla-api/v1/quiz", {
      body: {
        title,
        description,
        displaySettings: hasDisplaySettings
          ? {
              randomOrder: false,
              oneQuestionAtATime: false,
              randomSubset: randomSubset ?? false,
              questionCount: questionCount ?? undefined,
            }
          : undefined,
      },
    })
    .then(resolveJsonOATS);
}

export async function putQuiz(
  { id, revision, title, description, randomOrder, randomSubset, questionCount }: GQLMutationUpdateQuizArgs,
  context: Context,
): Promise<QuizDTO> {
  const hasDisplaySettingsChange = randomOrder != null || randomSubset != null || questionCount != null;
  const displaySettings = hasDisplaySettingsChange
    ? {
        ...(await fetchQuiz({ id }, context)).displaySettings,
        ...(randomOrder != null ? { randomOrder } : undefined),
        ...(randomSubset != null ? { randomSubset } : undefined),
        ...(questionCount != null ? { questionCount } : undefined),
      }
    : undefined;

  return client
    .PUT("/myndla-api/v1/quiz/{quiz-id}", {
      params: { path: { "quiz-id": id } },
      body: {
        revision,
        title: title ?? undefined,
        description: description ?? undefined,
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
      params: { path: { "quiz-id": id, status: status as QuizStatus } },
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
        questionType: (questionType as QuestionType) ?? undefined,
        title: title ?? undefined,
        alternatives: alternatives?.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
        glossaryPairs: undefined,
        required: required ?? undefined,
        alternativesRandomOrder: alternativesRandomOrder ?? undefined,
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
        questionType: questionType as QuestionType,
        title,
        alternatives: alternatives.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
        glossaryPairs: [],
        required: required ?? false,
        alternativesRandomOrder: alternativesRandomOrder ?? false,
      },
    })
    .then(resolveJsonOATS);
}

export async function deleteQuiz({ id }: GQLMutationDeleteQuizArgs, _context: Context): Promise<string> {
  await client.DELETE("/myndla-api/v1/quiz/{quiz-id}", { params: { path: { "quiz-id": id } } });
  return id;
}
