/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { skipToken, useSuspenseQuery } from "@apollo/client/react";
import { Suspense, useContext } from "react";
import { useParams, useSearchParams } from "react-router";
import { ContentPlaceholder } from "../../components/ContentPlaceholder";
import { DefaultErrorMessagePage } from "../../components/DefaultErrorMessage";
import { ResponseContext } from "../../components/ResponseContext";
import { SKIP_TO_CONTENT_ID } from "../../constants";
import type { GQLPlainArticlePageQuery, GQLPlainArticlePageQueryVariables } from "../../graphqlTypes";
import { NDLAError } from "../../util/error/NDLAError";
import { useRawLocation } from "../../util/localePath";
import { NotFoundPage } from "../NotFoundPage/NotFoundPage";
import { UnpublishedResourcePage } from "../UnpublishedResourcePage/UnpublishedResourcePage";
import { PlainArticleContainer, plainArticleContainerFragments } from "./PlainArticleContainer";

const plainArticlePageQuery: TypedDocumentNode<GQLPlainArticlePageQuery, GQLPlainArticlePageQueryVariables> = gql`
  query plainArticlePage($articleId: String!, $revision: Int, $transformArgs: TransformedArticleContentInput) {
    article(id: $articleId, revision: $revision) {
      ...PlainArticleContainer_Article
    }
  }
  ${plainArticleContainerFragments.article}
`;

export const PlainArticlePage = () => (
  <Suspense fallback={<ContentPlaceholder variant="article" />}>
    <PlainArticlePageContent />
  </Suspense>
);

const PlainArticlePageContent = () => {
  const { articleId } = useParams();
  const { pathname } = useRawLocation();
  const [searchParams] = useSearchParams();
  const revision = searchParams.get("revision");
  const responseContext = useContext(ResponseContext);
  const parsedRevision = revision ? Number(revision) : undefined;
  const { data, error } = useSuspenseQuery(
    plainArticlePageQuery,
    !articleId
      ? skipToken
      : {
          variables: {
            articleId,
            revision: parsedRevision ? parsedRevision : undefined,
            transformArgs: {
              showVisualElement: "true",
              path: pathname,
              isOembed: "false",
            },
          },
        },
  );

  if (responseContext?.status === 410) {
    return <UnpublishedResourcePage />;
  }

  if (error || !data) {
    return <DefaultErrorMessagePage error={error ?? new NDLAError("Missing data in plainArticlePage response")} />;
  }

  if (!data.article || parsedRevision === 0 || (revision && !parsedRevision)) {
    return <NotFoundPage />;
  }

  return (
    <PlainArticleContainer
      key={data.article.id}
      article={data.article}
      skipToContentId={SKIP_TO_CONTENT_ID}
      revision={parsedRevision}
    />
  );
};

export default PlainArticlePage;
