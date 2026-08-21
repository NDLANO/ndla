/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { QuizDTO, QuizSearchResultDTO } from "@ndla/types-backend/myndla-api";
import {
  deleteQuiz,
  deleteQuizQuestion,
  fetchQuiz,
  fetchQuizzes,
  postQuiz,
  postQuizQuestion,
  putQuiz,
  putQuizQuestion,
} from "../api/quizApi";
import type {
  GQLMutationAddQuizArgs,
  GQLMutationAddQuizQuestionArgs,
  GQLMutationDeleteQuizArgs,
  GQLMutationDeleteQuizQuestionArgs,
  GQLMutationResolvers,
  GQLMutationUpdateQuizArgs,
  GQLMutationUpdateQuizQuestionArgs,
  GQLQuery,
  GQLQueryQuizArgs,
  GQLQueryQuizzesArgs,
  GQLQueryResolvers,
} from "../types/schema";

const toGqlQuiz = (quiz: QuizDTO): GQLQuery["quiz"] => ({
  ...quiz,
  randomOrder: quiz.displaySettings.randomOrder,
});

const toGqlQuizSearchResult = (result: QuizSearchResultDTO): GQLQuery["quizzes"] => ({
  ...result,
  results: result.results.map(toGqlQuiz),
});

export const Query: Pick<GQLQueryResolvers, "quizzes" | "quiz"> = {
  async quizzes(_: any, params: GQLQueryQuizzesArgs, context: ContextWithLoaders): Promise<GQLQuery["quizzes"]> {
    return fetchQuizzes(params, context).then(toGqlQuizSearchResult);
  },
  async quiz(_: any, params: GQLQueryQuizArgs, context: ContextWithLoaders): Promise<GQLQuery["quiz"]> {
    return fetchQuiz(params, context).then(toGqlQuiz);
  },
};

export const Mutations: Pick<
  GQLMutationResolvers,
  "addQuiz" | "updateQuiz" | "addQuizQuestion" | "updateQuizQuestion" | "deleteQuizQuestion" | "deleteQuiz"
> = {
  async addQuiz(_: any, params: GQLMutationAddQuizArgs, context: ContextWithLoaders): Promise<GQLQuery["quiz"]> {
    return postQuiz(params, context).then(toGqlQuiz);
  },
  async updateQuiz(_: any, params: GQLMutationUpdateQuizArgs, context: ContextWithLoaders): Promise<GQLQuery["quiz"]> {
    return putQuiz(params, context).then(toGqlQuiz);
  },
  async addQuizQuestion(
    _: any,
    params: GQLMutationAddQuizQuestionArgs,
    context: ContextWithLoaders,
  ): Promise<GQLQuery["quiz"]> {
    return postQuizQuestion(params, context).then(toGqlQuiz);
  },
  async updateQuizQuestion(
    _: any,
    params: GQLMutationUpdateQuizQuestionArgs,
    context: ContextWithLoaders,
  ): Promise<GQLQuery["quiz"]> {
    return putQuizQuestion(params, context).then(toGqlQuiz);
  },
  async deleteQuizQuestion(
    _: any,
    params: GQLMutationDeleteQuizQuestionArgs,
    context: ContextWithLoaders,
  ): Promise<GQLQuery["quiz"]> {
    return deleteQuizQuestion(params, context).then(toGqlQuiz);
  },
  async deleteQuiz(_: any, params: GQLMutationDeleteQuizArgs, context: ContextWithLoaders): Promise<string> {
    return deleteQuiz(params, context);
  },
};
