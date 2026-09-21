/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  checkQuiz,
  deleteQuiz,
  deleteQuizQuestion,
  fetchQuiz,
  fetchQuizzes,
  postQuiz,
  postQuizQuestion,
  putQuiz,
  putQuizQuestion,
  putQuizStatus,
} from "../api/quizApi";
import type {
  GQLMutation,
  GQLMutationAddQuizArgs,
  GQLMutationAddQuizQuestionArgs,
  GQLMutationCheckQuizArgs,
  GQLMutationDeleteQuizArgs,
  GQLMutationDeleteQuizQuestionArgs,
  GQLMutationResolvers,
  GQLMutationUpdateQuizArgs,
  GQLMutationUpdateQuizQuestionArgs,
  GQLMutationUpdateQuizStatusArgs,
  GQLQuery,
  GQLQueryQuizArgs,
  GQLQueryQuizzesArgs,
  GQLQueryResolvers,
} from "../types/schema";

export const Query: Pick<GQLQueryResolvers, "quizzes" | "quiz"> = {
  async quizzes(_: any, params: GQLQueryQuizzesArgs, context: ContextWithLoaders): Promise<GQLQuery["quizzes"]> {
    return fetchQuizzes(params, context);
  },
  async quiz(_: any, params: GQLQueryQuizArgs, context: ContextWithLoaders): Promise<GQLQuery["quiz"]> {
    return fetchQuiz(params, context);
  },
};

export const Mutations: Pick<
  GQLMutationResolvers,
  | "addQuiz"
  | "updateQuiz"
  | "updateQuizStatus"
  | "addQuizQuestion"
  | "updateQuizQuestion"
  | "deleteQuizQuestion"
  | "deleteQuiz"
  | "checkQuiz"
> = {
  async addQuiz(_: any, params: GQLMutationAddQuizArgs, context: ContextWithLoaders): Promise<GQLQuery["quiz"]> {
    return postQuiz(params, context);
  },
  async updateQuiz(_: any, params: GQLMutationUpdateQuizArgs, context: ContextWithLoaders): Promise<GQLQuery["quiz"]> {
    return putQuiz(params, context);
  },
  async updateQuizStatus(
    _: any,
    params: GQLMutationUpdateQuizStatusArgs,
    context: ContextWithLoaders,
  ): Promise<GQLQuery["quiz"]> {
    return putQuizStatus(params, context);
  },
  async addQuizQuestion(
    _: any,
    params: GQLMutationAddQuizQuestionArgs,
    context: ContextWithLoaders,
  ): Promise<GQLQuery["quiz"]> {
    return postQuizQuestion(params, context);
  },
  async updateQuizQuestion(
    _: any,
    params: GQLMutationUpdateQuizQuestionArgs,
    context: ContextWithLoaders,
  ): Promise<GQLQuery["quiz"]> {
    return putQuizQuestion(params, context);
  },
  async deleteQuizQuestion(
    _: any,
    params: GQLMutationDeleteQuizQuestionArgs,
    context: ContextWithLoaders,
  ): Promise<GQLQuery["quiz"]> {
    return deleteQuizQuestion(params, context);
  },
  async deleteQuiz(_: any, params: GQLMutationDeleteQuizArgs, context: ContextWithLoaders): Promise<string> {
    return deleteQuiz(params, context);
  },
  async checkQuiz(
    _: any,
    params: GQLMutationCheckQuizArgs,
    context: ContextWithLoaders,
  ): Promise<GQLMutation["checkQuiz"]> {
    return checkQuiz(params, context);
  },
};
