/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql } from "@apollo/client";

export const quizFragment = gql`
  fragment Quiz on Quiz {
    __typename
    id
    revision
    title
    description
    status
    displaySettings {
      randomOrder
      randomSubset
      questionCount
    }
    created
    updated
    owner {
      __typename
      name
    }
    questions {
      __typename
      id
      questionType
      title
      required
      alternativesRandomOrder
      alternatives {
        __typename
        id
        text
        isCorrect
      }
    }
  }
`;

export const quizSummaryFragment = gql`
  fragment QuizSummary on Quiz {
    __typename
    id
    title
    status
    created
    owner {
      __typename
      name
    }
  }
`;
