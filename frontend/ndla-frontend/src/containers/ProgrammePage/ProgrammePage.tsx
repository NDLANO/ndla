/**
 * Copyright (c) 2019-present, NDLA.
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
import type { GQLProgrammePageQuery, GQLProgrammePageQueryVariables } from "../../graphqlTypes";
import { hasNotFoundStatus } from "../../util/handleError";
import { constructNewPath, isValidContextId } from "../../util/urlHelper";
import { NotFoundPage } from "../NotFoundPage/NotFoundPage";
import { ProgrammeContainer } from "./ProgrammeContainer";

const programmePageQuery: TypedDocumentNode<GQLProgrammePageQuery, GQLProgrammePageQueryVariables> = gql`
  query programmePage($contextId: String) {
    programme(contextId: $contextId) {
      grades {
        title {
          title
        }
      }
      supportedLanguages
      ...ProgrammeContainer_Programme
    }
  }
  ${ProgrammeContainer.fragments.programme}
`;

export const ProgrammePage = () => {
  const { programme, contextId } = useParams();

  if (programme?.includes("__")) {
    const [name = "", programmeId] = programme.split("__");
    let to = `/utdanning/${name}/${programmeId}`;
    if (contextId) {
      to += `/${contextId}`;
    }
    return <Navigate to={to} replace />;
  }

  return (
    <Suspense fallback={<ContentPlaceholder padding="large" />}>
      <ProgrammePageContent />
    </Suspense>
  );
};

const ProgrammePageContent = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const { contextId } = useParams();

  const { data, error } = useSuspenseQuery(
    programmePageQuery,
    !isValidContextId(contextId) ? skipToken : { variables: { contextId: contextId } },
  );

  if (error) {
    if (hasNotFoundStatus(error)) return <NotFoundPage />;
    return <DefaultErrorMessagePage />;
  }

  if (!data || !data.programme) {
    return <NotFoundPage />;
  }

  if (i18n.language === "se" && !data?.programme.supportedLanguages?.includes("se")) {
    return <RedirectExternal to={constructNewPath(location.pathname, "nb")} />;
  }

  return <ProgrammeContainer programme={data.programme} locale={i18n.language} />;
};

export const Component = ProgrammePage;
