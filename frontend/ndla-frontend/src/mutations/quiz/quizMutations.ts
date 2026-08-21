/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql } from "@apollo/client";
import type { TypedDocumentNode } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import type {
  GQLAddQuizMutation,
  GQLAddQuizMutationVariables,
  GQLAddQuizQuestionMutation,
  GQLAddQuizQuestionMutationVariables,
  GQLDeleteQuizMutation,
  GQLDeleteQuizMutationVariables,
} from "../../graphqlTypes";
import { quizFragment } from "./quizFragments";
import { quizzesQuery } from "./quizQueries";

const addQuizMutation: TypedDocumentNode<GQLAddQuizMutation, GQLAddQuizMutationVariables> = gql`
  mutation addQuiz($title: String!, $description: String) {
    addQuiz(title: $title, description: $description) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useAddQuizMutation = () => useMutation(addQuizMutation);

const addQuizQuestionMutation: TypedDocumentNode<GQLAddQuizQuestionMutation, GQLAddQuizQuestionMutationVariables> = gql`
  mutation addQuizQuestion(
    $quizId: String!
    $questionType: String!
    $title: String!
    $alternatives: [QuizAlternativeInput!]!
  ) {
    addQuizQuestion(quizId: $quizId, questionType: $questionType, title: $title, alternatives: $alternatives) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useAddQuizQuestionMutation = () => useMutation(addQuizQuestionMutation);

const deleteQuizMutation: TypedDocumentNode<GQLDeleteQuizMutation, GQLDeleteQuizMutationVariables> = gql`
  mutation deleteQuiz($id: String!) {
    deleteQuiz(id: $id)
  }
`;

export const useDeleteQuizMutation = () =>
  useMutation(deleteQuizMutation, {
    refetchQueries: [{ query: quizzesQuery }],
  });
