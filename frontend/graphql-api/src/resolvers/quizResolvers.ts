/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { QuizDTO, QuizSearchResultDTO } from "@ndla/types-backend/myndla-api";
import { deleteQuiz, fetchQuizzes, postQuiz, postQuizQuestion } from "../api/quizApi";
import {
  GQLMutationAddQuizArgs,
  GQLMutationAddQuizQuestionArgs,
  GQLMutationDeleteQuizArgs,
  GQLMutationResolvers,
  GQLQueryQuizzesArgs,
  GQLQueryResolvers,
} from "../types/schema";

export const Query: Pick<GQLQueryResolvers, "quizzes"> = {
  async quizzes(_: any, params: GQLQueryQuizzesArgs, context: ContextWithLoaders): Promise<QuizSearchResultDTO> {
    return fetchQuizzes(params, context);
  },
};

export const Mutations: Pick<GQLMutationResolvers, "addQuiz" | "addQuizQuestion" | "deleteQuiz"> = {
  async addQuiz(_: any, params: GQLMutationAddQuizArgs, context: ContextWithLoaders): Promise<QuizDTO> {
    return postQuiz(params, context);
  },
  async addQuizQuestion(_: any, params: GQLMutationAddQuizQuestionArgs, context: ContextWithLoaders): Promise<QuizDTO> {
    return postQuizQuestion(params, context);
  },
  async deleteQuiz(_: any, params: GQLMutationDeleteQuizArgs, context: ContextWithLoaders): Promise<string> {
    return deleteQuiz(params, context);
  },
};
