/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type ConceptDTO,
  type DraftConceptSearchParamsDTO,
  type ConceptSearchResultDTO,
  type NewConceptDTO,
  type TagsSearchResultDTO,
  type UpdatedConceptDTO,
  deleteConceptApiV1DraftsConceptId,
  getConceptApiV1DraftsConceptId,
  getConceptApiV1DraftsStatusStateMachine,
  getConceptApiV1DraftsTagSearch,
  getConceptApiV1DraftsTags,
  patchConceptApiV1DraftsConceptId,
  postConceptApiV1Drafts,
  postConceptApiV1DraftsSearch,
  putConceptApiV1DraftsConceptIdStatusStatus,
} from "@ndla/types-backend/concept-api";
import { createClient } from "@ndla/types-backend/concept-api/client";
import type { ConceptStatusStateMachineType } from "../../interfaces";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveJsonOATS } from "../../util/resolveJsonOrRejectWithError";

const client = createClient(apiClientConfig());

export const fetchSearchTags = async (query: string, language: string): Promise<TagsSearchResultDTO> =>
  getConceptApiV1DraftsTagSearch({
    client,
    query: {
      language,
      query,
    },
  }).then(resolveJsonOATS);

export const fetchAllTags = async (language: string): Promise<string[]> =>
  getConceptApiV1DraftsTags({
    client,
    query: {
      language,
      fallback: true,
    },
  }).then(resolveJsonOATS);

export const fetchConcept = async (conceptId: number, locale?: string): Promise<ConceptDTO> =>
  getConceptApiV1DraftsConceptId({
    client,
    path: {
      concept_id: conceptId,
    },
    query: {
      language: locale,
      fallback: true,
    },
  }).then(resolveJsonOATS);

export const addConcept = async (concept: NewConceptDTO): Promise<ConceptDTO> =>
  postConceptApiV1Drafts({ client, body: concept }).then(resolveJsonOATS);

export const updateConcept = async (id: number, concept: UpdatedConceptDTO): Promise<ConceptDTO> =>
  patchConceptApiV1DraftsConceptId({
    client,
    path: {
      concept_id: id,
    },
    body: concept,
  }).then(resolveJsonOATS);

export const deleteLanguageVersionConcept = async (conceptId: number, language: string): Promise<ConceptDTO> =>
  deleteConceptApiV1DraftsConceptId({ client, path: { concept_id: conceptId }, query: { language } }).then(
    resolveJsonOATS,
  );

export const fetchStatusStateMachine = async (): Promise<ConceptStatusStateMachineType> =>
  getConceptApiV1DraftsStatusStateMachine({ client }).then(resolveJsonOATS);

export const updateConceptStatus = async (id: number, status: string): Promise<ConceptDTO> =>
  putConceptApiV1DraftsConceptIdStatusStatus({ client, path: { concept_id: id, STATUS: status } }).then(
    resolveJsonOATS,
  );

export const postSearchConcepts = async (body: DraftConceptSearchParamsDTO): Promise<ConceptSearchResultDTO> =>
  postConceptApiV1DraftsSearch({ client, body }).then(resolveJsonOATS);
