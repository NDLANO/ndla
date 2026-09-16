/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Suspense } from "react";
import { useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../components/DefaultErrorMessage";
import { SKIP_TO_CONTENT_ID } from "../../constants";
import type { GQLPlainLearningpathPageQuery, GQLPlainLearningpathPageQueryVariables } from "../../graphqlTypes";
import { PlainLearningpathContainer, plainLearningpathContainerFragments } from "./PlainLearningpathContainer";

const plainLearningpathPageQuery: TypedDocumentNode<
  GQLPlainLearningpathPageQuery,
  GQLPlainLearningpathPageQueryVariables
> = gql`
  query plainLearningpathPage($pathId: String!, $transformArgs: TransformedArticleContentInput) {
    learningpath(pathId: $pathId) {
      ...PlainLearningpathContainer_Learningpath
    }
  }
  ${plainLearningpathContainerFragments.learningpath}
`;

export const PlainLearningpathPage = () => {
  const { stepId } = useParams();

  return (
    <Suspense
      fallback={
        <PlainLearningpathContainer
          learningpath={undefined}
          skipToContentId={SKIP_TO_CONTENT_ID}
          stepId={stepId}
          loading
        />
      }
    >
      <PlainLearningpathPageContent />
    </Suspense>
  );
};

const PlainLearningpathPageContent = () => {
  const { learningpathId, stepId } = useParams();

  const { data } = useSuspenseQuery(plainLearningpathPageQuery, {
    variables: { pathId: learningpathId ?? "" },
    skip: !learningpathId,
    errorPolicy: "all",
  });

  if (!data || !data.learningpath || (data.learningpath.learningsteps?.length ?? 0) < 1) {
    return <DefaultErrorMessagePage />;
  }

  return (
    <PlainLearningpathContainer
      learningpath={data.learningpath}
      skipToContentId={SKIP_TO_CONTENT_ID}
      stepId={stepId}
      loading={false}
    />
  );
};

export const Component = PlainLearningpathPage;
