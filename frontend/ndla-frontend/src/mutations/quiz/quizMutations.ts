/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import type {
  GQLAddQuizMutation,
  GQLAddQuizMutationVariables,
  GQLAddQuizQuestionMutation,
  GQLAddQuizQuestionMutationVariables,
  GQLCheckQuizMutation,
  GQLCheckQuizMutationVariables,
  GQLCloneQuizMutation,
  GQLCloneQuizMutationVariables,
  GQLDeleteQuizMutation,
  GQLDeleteQuizMutationVariables,
  GQLDeleteQuizQuestionMutation,
  GQLDeleteQuizQuestionMutationVariables,
  GQLSaveQuizMutation,
  GQLSaveQuizMutationVariables,
  GQLUnsaveQuizMutation,
  GQLUnsaveQuizMutationVariables,
  GQLUpdateQuizMutation,
  GQLUpdateQuizMutationVariables,
  GQLUpdateQuizQuestionMutation,
  GQLUpdateQuizQuestionMutationVariables,
  GQLUpdateQuizStatusMutation,
  GQLUpdateQuizStatusMutationVariables,
} from "../../graphqlTypes";
import { quizFragment } from "./quizFragments";

const addQuizMutation: TypedDocumentNode<GQLAddQuizMutation, GQLAddQuizMutationVariables> = gql`
  mutation addQuiz($title: String!, $description: String, $displaySettings: QuizDisplaySettingsInput) {
    addQuiz(title: $title, description: $description, displaySettings: $displaySettings) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useAddQuizMutation = (options?: useMutation.Options<GQLAddQuizMutation, GQLAddQuizMutationVariables>) =>
  useMutation(addQuizMutation, {
    ...options,
    update: (cache) => {
      cache.evict({ fieldName: "quizzes" });
    },
  });

const updateQuizMutation: TypedDocumentNode<GQLUpdateQuizMutation, GQLUpdateQuizMutationVariables> = gql`
  mutation updateQuiz(
    $id: String!
    $revision: Int!
    $title: String
    $description: String
    $displaySettings: QuizDisplaySettingsInput
  ) {
    updateQuiz(
      id: $id
      revision: $revision
      title: $title
      description: $description
      displaySettings: $displaySettings
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
    mutation updateQuizStatus($id: String!, $status: QuizStatus!) {
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
    $questionType: QuestionType!
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
    $questionType: QuestionType
    $title: String
    $alternatives: [QuizAlternativeInput!]
    $required: Boolean
    $alternativesRandomOrder: Boolean
    $sortOrder: Int
  ) {
    updateQuizQuestion(
      quizId: $quizId
      questionId: $questionId
      questionType: $questionType
      title: $title
      alternatives: $alternatives
      required: $required
      alternativesRandomOrder: $alternativesRandomOrder
      sortOrder: $sortOrder
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

const checkQuizMutation: TypedDocumentNode<GQLCheckQuizMutation, GQLCheckQuizMutationVariables> = gql`
  mutation checkQuiz($quizId: String!, $answers: [QuestionAnswerInput!]!) {
    checkQuiz(quizId: $quizId, answers: $answers) {
      totalScore
      maxScore
      results {
        questionId
        isCorrect
        score
        maxScore
        correctAlternativeIds
      }
    }
  }
`;

export const useCheckQuizMutation = (
  options?: useMutation.Options<GQLCheckQuizMutation, GQLCheckQuizMutationVariables>,
) => useMutation(checkQuizMutation, options);

const deleteQuizMutation: TypedDocumentNode<GQLDeleteQuizMutation, GQLDeleteQuizMutationVariables> = gql`
  mutation deleteQuiz($id: String!) {
    deleteQuiz(id: $id)
  }
`;

export const useDeleteQuizMutation = (
  options?: useMutation.Options<GQLDeleteQuizMutation, GQLDeleteQuizMutationVariables>,
) =>
  useMutation(deleteQuizMutation, {
    ...options,
    update: (cache, _result, { variables }) => {
      cache.evict({ id: cache.identify({ __typename: "Quiz", id: variables.id }) });
      cache.evict({ fieldName: "quizzes" });
      cache.gc();
    },
  });

const cloneQuizMutation: TypedDocumentNode<GQLCloneQuizMutation, GQLCloneQuizMutationVariables> = gql`
  mutation cloneQuiz($quizId: String!) {
    cloneQuiz(quizId: $quizId) {
      ...Quiz
    }
  }
  ${quizFragment}
`;

export const useCloneQuizMutation = (
  options?: useMutation.Options<GQLCloneQuizMutation, GQLCloneQuizMutationVariables>,
) =>
  useMutation(cloneQuizMutation, {
    ...options,
    update: (cache) => {
      cache.evict({ fieldName: "quizzes" });
    },
  });

const saveQuizMutation: TypedDocumentNode<GQLSaveQuizMutation, GQLSaveQuizMutationVariables> = gql`
  mutation saveQuiz($quizId: String!) {
    saveQuiz(quizId: $quizId)
  }
`;

export const useSaveQuizMutation = (
  options?: useMutation.Options<GQLSaveQuizMutation, GQLSaveQuizMutationVariables>,
) => {
  const client = useApolloClient();
  return useMutation(saveQuizMutation, {
    ...options,
    onCompleted: (_data, methodOptions) => {
      const id = methodOptions?.variables?.quizId;
      if (!id) return;
      const normalizedId = client.cache.identify({ __typename: "Quiz", id });
      if (!normalizedId) return;
      client.cache.modify({
        fields: {
          savedQuizzes: (existing: readonly { __ref: string }[] | undefined) =>
            existing && !existing.some((ref) => ref.__ref === normalizedId)
              ? [{ __ref: normalizedId }, ...existing]
              : existing,
        },
      });
    },
  });
};

const unsaveQuizMutation: TypedDocumentNode<GQLUnsaveQuizMutation, GQLUnsaveQuizMutationVariables> = gql`
  mutation unsaveQuiz($quizId: String!) {
    unsaveQuiz(quizId: $quizId)
  }
`;

export const useUnsaveQuizMutation = (
  options?: useMutation.Options<GQLUnsaveQuizMutation, GQLUnsaveQuizMutationVariables>,
) => {
  const client = useApolloClient();
  return useMutation(unsaveQuizMutation, {
    ...options,
    onCompleted: (_data, methodOptions) => {
      const id = methodOptions?.variables?.quizId;
      if (!id) return;
      const normalizedId = client.cache.identify({ __typename: "Quiz", id });
      client.cache.modify({
        fields: {
          savedQuizzes: (existing: readonly { __ref: string }[] | undefined) =>
            existing?.filter((ref) => ref.__ref !== normalizedId),
        },
      });
    },
  });
};
