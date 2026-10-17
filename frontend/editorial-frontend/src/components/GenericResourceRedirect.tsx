/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isApiNotFoundError } from "@ndla/api-client";
import { Spinner } from "@ndla/primitives";
import type { UseQueryResult } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router";
import NotFound from "../containers/NotFoundPage/NotFoundPage";
import { LocaleNavigate, useRawLocation } from "../util/localePath";
import type { CreatingLanguageLocationState } from "../util/routeHelpers";

interface Props {
  queryResult: UseQueryResult<{ supportedLanguages: string[] }>;
}

export const GenericResourceRedirect = ({ queryResult }: Props) => {
  const location = useRawLocation();
  const { selectedLanguage } = useParams<"selectedLanguage">();

  if (queryResult.isLoading) return <Spinner />;

  if (queryResult.isError && isApiNotFoundError(queryResult.error)) {
    return <NotFound />;
  }

  // TODO: Implementing actual error handling
  if (queryResult.isError || !queryResult.data) {
    return <NotFound />;
  }

  if (
    !selectedLanguage ||
    (!queryResult.data.supportedLanguages.includes(selectedLanguage) &&
      !(location.state as CreatingLanguageLocationState)?.isCreatingLanguage)
  ) {
    const fallbackLanguage = queryResult.data.supportedLanguages[0];
    if (!fallbackLanguage) return <NotFound />;
    return <LocaleNavigate replace to={fallbackLanguage} />;
  }

  return <Outlet context={queryResult.data} />;
};
