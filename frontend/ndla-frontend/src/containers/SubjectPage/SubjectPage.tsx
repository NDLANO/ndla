/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { skipToken, useSuspenseQuery } from "@apollo/client/react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useParams } from "react-router";
import { ContentPlaceholder } from "../../components/ContentPlaceholder";
import { DefaultErrorMessagePage } from "../../components/DefaultErrorMessage";
import { RedirectExternal } from "../../components/RedirectExternal";
import { FilmFrontpage } from "../../containers/FilmFrontpage/FilmFrontpage";
import type {
  GQLSubjectPageQuery,
  GQLSubjectPageQueryVariables,
  GQLSubjectVideoSearchQuery,
  GQLSubjectVideoSearchQueryVariables,
} from "../../graphqlTypes";
import { getSubjectType } from "../../routeHelpers";
import { hasNotFoundStatus } from "../../util/handleError";
import { constructNewPath, isValidContextId } from "../../util/urlHelper";
import { NotFoundPage } from "../NotFoundPage/NotFoundPage";
import { SubjectContainer } from "./SubjectContainer";

const subjectPageQuery: TypedDocumentNode<GQLSubjectPageQuery, GQLSubjectPageQueryVariables> = gql`
  query subjectPage($subjectId: String, $contextId: String, $metadataFilterKey: String, $metadataFilterValue: String) {
    node(id: $subjectId, contextId: $contextId) {
      ...SubjectContainer_Node
    }
    nodes(metadataFilterKey: $metadataFilterKey, metadataFilterValue: $metadataFilterValue, filterVisible: true) {
      url
      metadata {
        customFields
      }
    }
  }
  ${SubjectContainer.fragments.subject}
`;

const videoQueryDef: TypedDocumentNode<GQLSubjectVideoSearchQuery, GQLSubjectVideoSearchQueryVariables> = gql`
  query subjectVideoSearch($subjectId: String!, $language: String!) {
    search(subjects: $subjectId, traits: "VIDEO", language: $language, sort: "-lastUpdated", pageSize: 8) {
      results {
        ...SubjectContainer_SearchResult
      }
    }
  }
  ${SubjectContainer.fragments.searchResult}
`;

export const SubjectPage = () => (
  <Suspense fallback={<ContentPlaceholder />}>
    <SubjectPageContent />
  </Suspense>
);

const SubjectPageContent = () => {
  const { contextId } = useParams();
  const location = useLocation();
  const { i18n } = useTranslation();
  const { error, data } = useSuspenseQuery(
    subjectPageQuery,
    !isValidContextId(contextId) ? skipToken : { variables: { contextId: contextId } },
  );

  const videoQuery = useSuspenseQuery(
    videoQueryDef,
    !data?.node?.id ? skipToken : { variables: { subjectId: data.node.id, language: i18n.language } },
  );

  if (error) {
    if (hasNotFoundStatus(error)) {
      return <NotFoundPage />;
    }
    return <DefaultErrorMessagePage />;
  }

  if (!data) {
    return <NotFoundPage />;
  }

  if (!data.node || !data.node.url) {
    const redirect = data.nodes?.[0];
    if (!redirect) {
      return <NotFoundPage />;
    } else {
      return <Navigate to={redirect.url || ""} replace />;
    }
  }
  if (i18n.language === "se" && !data.node.supportedLanguages?.includes("se")) {
    return <RedirectExternal to={constructNewPath(location.pathname, "nb")} />;
  }
  const subjectType = getSubjectType(data.node.id);
  if (subjectType === "film") {
    return <FilmFrontpage />;
  }

  return (
    <SubjectContainer
      node={data.node}
      subjectType={subjectType}
      searchResults={videoQuery.data?.search?.results ?? []}
    />
  );
};

export const Component = SubjectPage;
