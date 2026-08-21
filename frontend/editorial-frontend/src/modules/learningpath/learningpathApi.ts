/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type LearningPathSummaryV2DTO,
  type LearningPathTagsSummaryDTO,
  type LearningPathV2DTO,
  type LearningStepV2DTO,
  type NewCopyLearningPathV2DTO,
  type NewLearningPathV2DTO,
  type NewLearningStepV2DTO,
  type SearchResultV2DTO,
  type UpdatedLearningPathV2DTO,
  type UpdatedLearningStepV2DTO,
  deleteLearningpathApiV2LearningpathsLearningpathIdLanguageP1,
  deleteLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId,
  getLearningpathApiV2LearningpathsContainsArticleArticleId,
  getLearningpathApiV2LearningpathsExternalSamples,
  getLearningpathApiV2LearningpathsIds,
  getLearningpathApiV2LearningpathsLearningpathId,
  getLearningpathApiV2LearningpathsTags,
  patchLearningpathApiV2LearningpathsLearningpathId,
  patchLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId,
  postLearningpathApiV2Learningpaths,
  postLearningpathApiV2LearningpathsLearningpathIdCopy,
  postLearningpathApiV2LearningpathsLearningpathIdLearningsteps,
  postLearningpathApiV2LearningpathsLearningpathIdUpdateTaxonomy,
  postLearningpathApiV2LearningpathsSearch,
  putLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepIdSeqno,
  putLearningpathApiV2LearningpathsLearningpathIdStatus,
} from "@ndla/types-backend/learningpath-api";
import { createClient } from "@ndla/types-backend/learningpath-api/client";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveJsonOATS } from "../../util/resolveJsonOrRejectWithError";
import type { CopyLearningPathBody, SearchBody } from "./learningpathApiInterfaces";

const client = createClient(apiClientConfig());

export const fetchLearningpath = (id: number, locale?: string): Promise<LearningPathV2DTO> =>
  getLearningpathApiV2LearningpathsLearningpathId({
    client,
    path: { learningpath_id: id },
    query: { language: locale, fallback: true },
  }).then(resolveJsonOATS);

export const fetchLearningpathTags = async (
  language?: string,
  fallback?: boolean,
): Promise<LearningPathTagsSummaryDTO> => {
  const res = await getLearningpathApiV2LearningpathsTags({ client, query: { language, fallback } });
  return resolveJsonOATS(res);
};

export const fetchLearningpaths = (ids: number[], language?: string): Promise<LearningPathV2DTO[]> =>
  getLearningpathApiV2LearningpathsIds({
    client,
    query: {
      ids,
      language,
      fallback: true,
      page: 1,
      "page-size": ids.length,
    },
  }).then(resolveJsonOATS);

export const fetchLearningpathsWithArticle = (id: number): Promise<LearningPathSummaryV2DTO[]> =>
  getLearningpathApiV2LearningpathsContainsArticleArticleId({ client, path: { article_id: id } }).then(resolveJsonOATS);

export const updateStatusLearningpath = (id: number, status: string, message?: string): Promise<LearningPathV2DTO> =>
  putLearningpathApiV2LearningpathsLearningpathIdStatus({
    client,
    path: { learningpath_id: id },
    body: { status, message },
  }).then(resolveJsonOATS);

export const updateLearningPathTaxonomy = (id: number, createIfMissing: boolean = false): Promise<LearningPathV2DTO> =>
  postLearningpathApiV2LearningpathsLearningpathIdUpdateTaxonomy({
    client,
    path: { learningpath_id: id },
    query: { "create-if-missing": createIfMissing },
  }).then(resolveJsonOATS);

export const learningpathSearch = async (query: SearchBody & { ids?: number[] }): Promise<SearchResultV2DTO> => {
  if (query.ids && query.ids.length === 0) {
    return {
      totalCount: 0,
      page: 1,
      pageSize: 0,
      language: "nb",
      results: [],
    };
  }

  return postLearningpathApiV2LearningpathsSearch({ client, body: query }).then(resolveJsonOATS);
};

export const learningpathCopy = (id: number, query: CopyLearningPathBody): Promise<LearningPathV2DTO> =>
  postLearningpathApiV2LearningpathsLearningpathIdCopy({ client, body: query, path: { learningpath_id: id } }).then(
    resolveJsonOATS,
  );

export const postLearningpath = async (learningpath: NewLearningPathV2DTO): Promise<LearningPathV2DTO> => {
  const res = await postLearningpathApiV2Learningpaths({ client, body: learningpath });
  return resolveJsonOATS(res);
};

export const patchLearningpath = async (
  id: number,
  learningpath: UpdatedLearningPathV2DTO,
): Promise<LearningPathV2DTO> => {
  const res = await patchLearningpathApiV2LearningpathsLearningpathId({
    client,
    body: learningpath,
    path: { learningpath_id: id },
  });
  return resolveJsonOATS(res);
};

export const deleteLearningpathLanguage = async (id: number, language: string): Promise<boolean> => {
  const res = await deleteLearningpathApiV2LearningpathsLearningpathIdLanguageP1({
    client,
    path: { learningpath_id: id, p1: language },
  });
  return res.response?.ok ?? false;
};

export const postLearningStep = async (id: number, step: NewLearningStepV2DTO): Promise<LearningStepV2DTO> => {
  const res = await postLearningpathApiV2LearningpathsLearningpathIdLearningsteps({
    client,
    body: step,
    path: { learningpath_id: id },
  });
  return resolveJsonOATS(res);
};

export const patchLearningStep = async (
  learningpathId: number,
  stepId: number,
  step: UpdatedLearningStepV2DTO,
): Promise<LearningStepV2DTO> => {
  const res = await patchLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId({
    client,
    body: step,
    path: { learningpath_id: learningpathId, learningstep_id: stepId },
  });
  return resolveJsonOATS(res);
};

export const deleteLearningStep = async (learningpathId: number, stepId: number): Promise<boolean> => {
  const res = await deleteLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId({
    client,
    path: { learningpath_id: learningpathId, learningstep_id: stepId },
  });
  return res.response?.ok ?? false;
};

export const putLearningStepOrder = async (learningpathId: number, stepId: number, seqNo: number): Promise<boolean> => {
  const res = await putLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepIdSeqno({
    client,
    path: { learningpath_id: learningpathId, learningstep_id: stepId },
    body: { seqNo },
  });
  return res.response?.ok ?? false;
};

export const putLearningpathStatus = async (learningpathId: number, status: string): Promise<boolean> => {
  const res = await putLearningpathApiV2LearningpathsLearningpathIdStatus({
    client,
    path: { learningpath_id: learningpathId },
    body: { status },
  });
  return res.response?.ok ?? false;
};

export const postCopyLearningpath = async (
  learningpathId: number,
  learningpath: NewCopyLearningPathV2DTO,
): Promise<LearningPathV2DTO> => {
  const res = await postLearningpathApiV2LearningpathsLearningpathIdCopy({
    client,
    path: { learningpath_id: learningpathId },
    body: learningpath,
  });

  return resolveJsonOATS(res);
};

export const fetchLearningStepSamples = async (): Promise<LearningPathV2DTO[]> => {
  const res = await getLearningpathApiV2LearningpathsExternalSamples({ client });
  return resolveJsonOATS(res);
};
