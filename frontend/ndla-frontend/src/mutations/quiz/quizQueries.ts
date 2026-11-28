/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  GQLQuizIsSavedQuery,
  GQLQuizIsSavedQueryVariables,
  GQLQuizQuery,
  GQLQuizQueryVariables,
  GQLQuizzesQuery,
  GQLQuizzesQueryVariables,
  GQLSavedQuizzesQuery,
  GQLSavedQuizzesQueryVariables,
} from "../../graphqlTypes";
import { quizFragment, quizSummaryFragment } from "./quizFragments";

export const quizzesQuery: TypedDocumentNode<GQLQuizzesQuery, GQLQuizzesQueryVariables> = gql`
  query quizzes($page: Int, $pageSize: Int, $sort: String) {
    quizzes(page: $page, pageSize: $pageSize, sort: $sort) {
      totalCount
      page
      pageSize
      results {
        ...QuizSummary
      }
    }
  }
  ${quizSummaryFragment}
`;

export const quizQuery: TypedDocumentNode<GQLQuizQuery, GQLQuizQueryVariables> = gql`
  query quiz($id: String!) {
    quiz(id: $id) {
      ...Quiz
      owner {
        name
      }
    }
  }
  ${quizFragment}
`;

export const quizIsSavedQuery: TypedDocumentNode<GQLQuizIsSavedQuery, GQLQuizIsSavedQueryVariables> = gql`
  query quizIsSaved($id: String!) {
    quiz(id: $id) {
      id
      isSaved
    }
  }
`;

export const savedQuizzesQuery: TypedDocumentNode<GQLSavedQuizzesQuery, GQLSavedQuizzesQueryVariables> = gql`
  query savedQuizzes($page: Int, $pageSize: Int, $sort: String) {
    savedQuizzes(page: $page, pageSize: $pageSize, sort: $sort) {
      totalCount
      page
      pageSize
      results {
        ...QuizSummary
      }
    }
  }
  ${quizSummaryFragment}
`;
