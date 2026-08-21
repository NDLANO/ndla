/**
 * Copyright (c) 2020-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type ConceptSearchResultDTO,
  type ConceptDTO,
  getConceptApiV1Concepts,
  getConceptApiV1ConceptsConceptId,
  getConceptApiV1DraftsConceptId,
} from "@ndla/types-backend/concept-api";
import { createClient } from "@ndla/types-backend/concept-api/client";
import { apiClientConfig, resolveJsonOATS } from "../utils/api-client/utils";
import { getNumberIdOrThrow } from "../utils/apiHelpers";

const client = createClient(apiClientConfig());

export async function searchConcepts(
  params: {
    ids?: number[];
  },
  _context: Context,
): Promise<ConceptSearchResultDTO> {
  return getConceptApiV1Concepts({
    client,
    query: {
      ids: params.ids,
      "page-size": params.ids?.length,
      sort: "title",
    },
  }).then(resolveJsonOATS);
}

export async function fetchConcept(id: string | number, context: Context): Promise<ConceptDTO | undefined> {
  const response = await getConceptApiV1ConceptsConceptId({
    client,
    path: {
      concept_id: getNumberIdOrThrow(id),
    },
    query: {
      language: context.language,
      fallback: true,
    },
  });
  try {
    const concept: ConceptDTO = await resolveJsonOATS(response);
    return concept;
  } catch (e) {
    return undefined;
  }
}

export const fetchEmbedConcept = async (id: string, context: Context, draftConcept: boolean): Promise<ConceptDTO> => {
  const options = {
    path: { concept_id: getNumberIdOrThrow(id) },
    query: { language: context.language, fallback: true },
  };

  if (draftConcept) {
    return getConceptApiV1DraftsConceptId({ client, ...options }).then(resolveJsonOATS);
  } else {
    return getConceptApiV1ConceptsConceptId({ client, ...options }).then(resolveJsonOATS);
  }
};
