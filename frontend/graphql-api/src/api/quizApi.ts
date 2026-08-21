/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { paths, QuestionType, QuizDTO, QuizSearchResultDTO } from "@ndla/types-backend/myndla-api";
import type {
  GQLMutationAddQuizArgs,
  GQLMutationAddQuizQuestionArgs,
  GQLMutationDeleteQuizArgs,
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

export async function postQuiz({ title, description }: GQLMutationAddQuizArgs, _context: Context): Promise<QuizDTO> {
  return client.POST("/myndla-api/v1/quiz", { body: { title, description } }).then(resolveJsonOATS);
}

export async function postQuizQuestion(
  { quizId, questionType, title, alternatives }: GQLMutationAddQuizQuestionArgs,
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
      },
    })
    .then(resolveJsonOATS);
}

export async function deleteQuiz({ id }: GQLMutationDeleteQuizArgs, _context: Context): Promise<string> {
  await client.DELETE("/myndla-api/v1/quiz/{quiz-id}", { params: { path: { "quiz-id": id } } });
  return id;
}
