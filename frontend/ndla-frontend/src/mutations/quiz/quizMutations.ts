/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import type {
  GQLAddQuizMutation,
  GQLAddQuizMutationVariables,
  GQLAddQuizQuestionMutation,
  GQLAddQuizQuestionMutationVariables,
  GQLDeleteQuizMutation,
  GQLDeleteQuizMutationVariables,
  GQLDeleteQuizQuestionMutation,
  GQLDeleteQuizQuestionMutationVariables,
  GQLUpdateQuizMutation,
  GQLUpdateQuizMutationVariables,
  GQLUpdateQuizQuestionMutation,
  GQLUpdateQuizQuestionMutationVariables,
  GQLUpdateQuizStatusMutation,
  GQLUpdateQuizStatusMutationVariables,
} from "../../graphqlTypes";
import { quizFragment } from "./quizFragments";
import { quizzesQuery } from "./quizQueries";

const addQuizMutation: TypedDocumentNode<GQLAddQuizMutation, GQLAddQuizMutationVariables> = gql`
  mutation addQuiz($title: String!, $description: String, $randomSubset: Boolean, $questionCount: Int) {
    addQuiz(title: $title, description: $description, randomSubset: $randomSubset, questionCount: $questionCount) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useAddQuizMutation = (options?: useMutation.Options<GQLAddQuizMutation, GQLAddQuizMutationVariables>) =>
  useMutation(addQuizMutation, {
    // Write the new quiz straight into the cached list instead of refetching it: the list
    // endpoint sits behind a CDN cache that can serve a stale response for a while after a
    // write, which would otherwise make a freshly created quiz vanish again after a refetch.
    update(cache, { data }) {
      const newQuiz = data?.addQuiz;
      if (!newQuiz) return;
      const existing = cache.readQuery({ query: quizzesQuery });
      if (!existing) return;
      cache.writeQuery({
        query: quizzesQuery,
        data: {
          quizzes: {
            ...existing.quizzes,
            totalCount: existing.quizzes.totalCount + 1,
            results: [newQuiz, ...existing.quizzes.results],
          },
        },
      });
    },
    ...options,
  });

const updateQuizMutation: TypedDocumentNode<GQLUpdateQuizMutation, GQLUpdateQuizMutationVariables> = gql`
  mutation updateQuiz(
    $id: String!
    $revision: Int!
    $title: String
    $description: String
    $randomOrder: Boolean
    $randomSubset: Boolean
    $questionCount: Int
  ) {
    updateQuiz(
      id: $id
      revision: $revision
      title: $title
      description: $description
      randomOrder: $randomOrder
      randomSubset: $randomSubset
      questionCount: $questionCount
    ) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useUpdateQuizMutation = (
  options?: useMutation.Options<GQLUpdateQuizMutation, GQLUpdateQuizMutationVariables>,
) => useMutation(updateQuizMutation, options);

const updateQuizStatusMutation: TypedDocumentNode<GQLUpdateQuizStatusMutation, GQLUpdateQuizStatusMutationVariables> =
  gql`
    mutation updateQuizStatus($id: String!, $status: String!) {
      updateQuizStatus(id: $id, status: $status) {
        ...Quiz
      }
    }
    ${quizFragment}
  `;

export const useUpdateQuizStatusMutation = (
  options?: useMutation.Options<GQLUpdateQuizStatusMutation, GQLUpdateQuizStatusMutationVariables>,
) => useMutation(updateQuizStatusMutation, options);

const addQuizQuestionMutation: TypedDocumentNode<GQLAddQuizQuestionMutation, GQLAddQuizQuestionMutationVariables> = gql`
  mutation addQuizQuestion(
    $quizId: String!
    $questionType: String!
    $title: String!
    $alternatives: [QuizAlternativeInput!]!
    $required: Boolean
    $alternativesRandomOrder: Boolean
  ) {
    addQuizQuestion(
      quizId: $quizId
      questionType: $questionType
      title: $title
      alternatives: $alternatives
      required: $required
      alternativesRandomOrder: $alternativesRandomOrder
    ) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useAddQuizQuestionMutation = (
  options?: useMutation.Options<GQLAddQuizQuestionMutation, GQLAddQuizQuestionMutationVariables>,
) => useMutation(addQuizQuestionMutation, options);

const updateQuizQuestionMutation: TypedDocumentNode<
  GQLUpdateQuizQuestionMutation,
  GQLUpdateQuizQuestionMutationVariables
> = gql`
  mutation updateQuizQuestion(
    $quizId: String!
    $questionId: String!
    $questionType: String
    $title: String
    $alternatives: [QuizAlternativeInput!]
    $required: Boolean
    $alternativesRandomOrder: Boolean
  ) {
    updateQuizQuestion(
      quizId: $quizId
      questionId: $questionId
      questionType: $questionType
      title: $title
      alternatives: $alternatives
      required: $required
      alternativesRandomOrder: $alternativesRandomOrder
    ) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useUpdateQuizQuestionMutation = (
  options?: useMutation.Options<GQLUpdateQuizQuestionMutation, GQLUpdateQuizQuestionMutationVariables>,
) => useMutation(updateQuizQuestionMutation, options);

const deleteQuizQuestionMutation: TypedDocumentNode<
  GQLDeleteQuizQuestionMutation,
  GQLDeleteQuizQuestionMutationVariables
> = gql`
  mutation deleteQuizQuestion($quizId: String!, $questionId: String!) {
    deleteQuizQuestion(quizId: $quizId, questionId: $questionId) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useDeleteQuizQuestionMutation = (
  options?: useMutation.Options<GQLDeleteQuizQuestionMutation, GQLDeleteQuizQuestionMutationVariables>,
) => useMutation(deleteQuizQuestionMutation, options);

const deleteQuizMutation: TypedDocumentNode<GQLDeleteQuizMutation, GQLDeleteQuizMutationVariables> = gql`
  mutation deleteQuiz($id: String!) {
    deleteQuiz(id: $id)
  }
`;

export const useDeleteQuizMutation = (
  options?: useMutation.Options<GQLDeleteQuizMutation, GQLDeleteQuizMutationVariables>,
) =>
  useMutation(deleteQuizMutation, {
    // Remove the quiz from the cached list directly (see useAddQuizMutation for why this
    // doesn't just refetch: the list endpoint's CDN cache can still serve the deleted quiz for
    // a while afterwards).
    update(cache, { data }) {
      const deletedId = data?.deleteQuiz;
      if (!deletedId) return;
      const existing = cache.readQuery({ query: quizzesQuery });
      if (existing) {
        cache.writeQuery({
          query: quizzesQuery,
          data: {
            quizzes: {
              ...existing.quizzes,
              totalCount: Math.max(0, existing.quizzes.totalCount - 1),
              results: existing.quizzes.results.filter((quiz) => quiz.id !== deletedId),
            },
          },
        });
      }
      cache.evict({ id: cache.identify({ __typename: "Quiz", id: deletedId }) });
      cache.gc();
    },
    ...options,
  });
