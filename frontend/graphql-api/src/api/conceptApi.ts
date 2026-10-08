/**
 * Copyright (c) 2020-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS } from "@ndla/api-client";
import {
  getConceptApiV1Concepts,
  getConceptApiV1ConceptsConceptId,
  getConceptApiV1DraftsConceptId,
  type ConceptSearchResultDTO,
  type ConceptDTO,
} from "@ndla/types-backend/concept-api";
import { createClient } from "@ndla/types-backend/concept-api/client";
import { clientConfig } from "../utils/apiClient/clientConfig";
import { getNumberIdOrThrow } from "../utils/apiHelpers";

const client = createClient(clientConfig());

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
  } catch {
    return undefined;
  }
}

export const fetchEmbedConcept = async (id: string, context: Context, draftConcept: boolean): Promise<ConceptDTO> => {
  const options = {
    client,
    path: { concept_id: getNumberIdOrThrow(id) },
    query: { language: context.language, fallback: true },
  };

  if (draftConcept) {
    return getConceptApiV1DraftsConceptId(options).then(resolveJsonOATS);
  } else {
    return getConceptApiV1ConceptsConceptId(options).then(resolveJsonOATS);
  }
};
