/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type GrepSearchInputDTO,
  type GrepSearchResultsDTO,
  type MultiSearchResultDTO,
  type SubjectAggregationsDTO,
  type SubjectAggsInputDTO,
  postSearchApiV1Search,
  postSearchApiV1SearchEditorial,
  postSearchApiV1SearchGrep,
  postSearchApiV1SearchSubjects,
} from "@ndla/types-backend/search-api";
import { createClient } from "@ndla/types-backend/search-api/client";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveJsonOATS } from "../../util/resolveJsonOrRejectWithError";
import { transformSearchBody } from "../../util/searchHelpers";
import type { MultiSummarySearchResults, NoNodeDraftSearchParams, NoNodeSearchParams } from "./searchApiInterfaces";

const client = createClient(apiClientConfig());

export const postSearch = async (body: NoNodeDraftSearchParams): Promise<MultiSummarySearchResults> => {
  const response = await postSearchApiV1SearchEditorial({ client, body: transformSearchBody(body) }).then(
    resolveJsonOATS,
  );
  return convertSearchTypeOrThrowError(response);
};

export const convertSearchTypeOrThrowError = (result: MultiSearchResultDTO): MultiSummarySearchResults => {
  const wrongType = result.results.find((result) => {
    return result.typename !== "MultiSearchSummaryDTO";
  });

  if (wrongType !== undefined) {
    throw new Error("Got unexpected typename from search-api. This is a bug");
  }

  return {
    ...result,
    results: result.results.filter((result) => {
      return result.typename === "MultiSearchSummaryDTO";
    }),
  };
};

export const searchResources = async (body: NoNodeSearchParams): Promise<MultiSummarySearchResults> => {
  const response = await postSearchApiV1Search({
    client,
    body: {
      ...transformSearchBody(body),
      sort: body.sort,
      resultTypes: body.resultTypes,
    },
  }).then(resolveJsonOATS);
  return convertSearchTypeOrThrowError(response);
};

export const searchSubjectStats = async (body: SubjectAggsInputDTO): Promise<SubjectAggregationsDTO> =>
  postSearchApiV1SearchSubjects({ client, body: transformSearchBody(body) }).then(resolveJsonOATS);

export const searchGrepCodes = async (body: GrepSearchInputDTO): Promise<GrepSearchResultsDTO> =>
  postSearchApiV1SearchGrep({ client, body }).then(resolveJsonOATS);
