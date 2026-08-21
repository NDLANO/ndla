/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql,type TypedDocumentNode } from "@apollo/client";
import type { GQLQuizzesQuery, GQLQuizzesQueryVariables } from "../../graphqlTypes";
import { quizFragment } from "./quizFragments";

export const quizzesQuery: TypedDocumentNode<GQLQuizzesQuery, GQLQuizzesQueryVariables> = gql`
  query quizzes {
    quizzes {
      totalCount
      page
      pageSize
      results {
        ...Quiz
      }
    }
  }
  ${quizFragment}
`;
