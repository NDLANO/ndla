/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS, resolveResponse } from "@ndla/api-client";
import {
  deleteLearningpathApiV2LearningpathsLearningpathId,
  deleteLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId,
  getLearningpathApiV2LearningpathsIds,
  getLearningpathApiV2LearningpathsLearningpathId,
  getLearningpathApiV2LearningpathsMine,
  patchLearningpathApiV2LearningpathsLearningpathId,
  patchLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId,
  postLearningpathApiV2Learningpaths,
  postLearningpathApiV2LearningpathsLearningpathIdCopy,
  postLearningpathApiV2LearningpathsLearningpathIdLearningsteps,
  putLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepIdSeqno,
  putLearningpathApiV2LearningpathsLearningpathIdStatus,
  type LearningPathV2DTO,
  type LearningStepV2DTO,
  type AuthorDTO,
  type CopyrightDTO,
} from "@ndla/types-backend/learningpath-api";
import { createClient } from "@ndla/types-backend/learningpath-api/client";
import type {
  GQLLearningpathSeqNo,
  GQLMutationCopyLearningpathArgs,
  GQLMutationDeleteLearningpathStepArgs,
  GQLMutationNewLearningpathArgs,
  GQLMutationNewLearningpathStepArgs,
  GQLMutationUpdateLearningpathArgs,
  GQLMutationUpdateLearningpathStatusArgs,
  GQLMutationUpdateLearningpathStepArgs,
  GQLMutationUpdateLearningpathStepSeqNoArgs,
} from "../types/schema";
import { clientConfig } from "../utils/apiClient/clientConfig";
import { getNumberIdOrThrow } from "../utils/apiHelpers";

const client = createClient(clientConfig());
const cachelessClient = createClient(clientConfig({ disableCache: true }));

export async function fetchLearningpaths(
  learningpathIds: readonly number[],
  context: Context,
): Promise<Array<LearningPathV2DTO | undefined>> {
  const json = await getLearningpathApiV2LearningpathsIds({
    client,
    query: {
      ids: learningpathIds.slice(),
      "page-size": learningpathIds.length,
      language: context.language,
      fallback: true,
    },
  }).then(resolveJsonOATS);
  // The api does not always return the exact number of results as ids provided.
  // So always map over ids so that dataLoader gets the right amount of results in correct order.
  return learningpathIds.map((id) => {
    const learningpath = json.find((item) => {
      return item.id === id;
    });
    return learningpath;
  });
}

export async function fetchMyLearningpaths(_context: Context): Promise<Array<LearningPathV2DTO>> {
  return getLearningpathApiV2LearningpathsMine({ client: cachelessClient }).then(resolveJsonOATS);
}

export async function fetchMyLearningpath(id: string, context: Context): Promise<LearningPathV2DTO> {
  return getLearningpathApiV2LearningpathsLearningpathId({
    client: cachelessClient,
    path: {
      learningpath_id: getNumberIdOrThrow(id),
    },
    query: {
      language: context.language,
      fallback: true,
    },
  }).then(resolveJsonOATS);
}

export async function fetchLearningpath(id: string, context: Context): Promise<LearningPathV2DTO> {
  return getLearningpathApiV2LearningpathsLearningpathId({
    client,
    path: {
      learningpath_id: getNumberIdOrThrow(id),
    },
    query: {
      language: context.language,
      fallback: true,
    },
  }).then(resolveJsonOATS);
}

export async function updateLearningpathStatus(
  { id, status }: GQLMutationUpdateLearningpathStatusArgs,
  _context: Context,
): Promise<LearningPathV2DTO> {
  return putLearningpathApiV2LearningpathsLearningpathIdStatus({
    client,
    path: { learningpath_id: id },
    body: { status },
  }).then(resolveJsonOATS);
}

export async function deleteLearningpath(id: number, _context: Context): Promise<boolean> {
  const res = await deleteLearningpathApiV2LearningpathsLearningpathId({ client, path: { learningpath_id: id } });
  return resolveResponse(res).ok;
}

export async function createLearningpath(
  { params }: GQLMutationNewLearningpathArgs,
  _context: Context,
): Promise<LearningPathV2DTO> {
  return postLearningpathApiV2Learningpaths({
    client,
    body: {
      ...params,
      copyright: {
        ...params.copyright,
        contributors: params.copyright.contributors as AuthorDTO[],
      },
    },
  }).then(resolveJsonOATS);
}

export async function updateLearningpath(
  { learningpathId, params }: GQLMutationUpdateLearningpathArgs,
  _context: Context,
): Promise<LearningPathV2DTO> {
  const copyright = params.copyright
    ? {
        ...params.copyright,
        contributors: params.copyright?.contributors as AuthorDTO[],
      }
    : undefined;
  return patchLearningpathApiV2LearningpathsLearningpathId({
    client,
    path: { learningpath_id: learningpathId },
    body: {
      ...params,
      copyright,
    },
  }).then(resolveJsonOATS);
}

export async function createLearningstep(
  { learningpathId, params }: GQLMutationNewLearningpathStepArgs,
  _context: Context,
): Promise<LearningStepV2DTO> {
  return postLearningpathApiV2LearningpathsLearningpathIdLearningsteps({
    client,
    path: { learningpath_id: learningpathId },
    body: {
      ...params,
      copyright: params.copyright as CopyrightDTO | undefined,
    },
  }).then(resolveJsonOATS);
}

export async function updateLearningstep(
  { learningpathId, learningstepId, params }: GQLMutationUpdateLearningpathStepArgs,
  _context: Context,
): Promise<LearningStepV2DTO> {
  return patchLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId({
    client,
    path: {
      learningpath_id: learningpathId,
      learningstep_id: learningstepId,
    },
    body: {
      ...params,
      copyright: params.copyright as CopyrightDTO | undefined,
    },
  }).then(resolveJsonOATS);
}

export async function deleteLearningstep(
  { learningstepId, learningpathId }: GQLMutationDeleteLearningpathStepArgs,
  _context: Context,
): Promise<boolean> {
  const res = await deleteLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepId({
    client,
    path: {
      learningpath_id: learningpathId,
      learningstep_id: learningstepId,
    },
  });
  return resolveResponse(res).ok;
}

export async function copyLearningpath(
  { learningpathId, params }: GQLMutationCopyLearningpathArgs,
  _context: Context,
): Promise<LearningPathV2DTO> {
  const copyright = params.copyright
    ? {
        ...params.copyright,
        contributors: params.copyright.contributors as AuthorDTO[],
      }
    : undefined;
  return postLearningpathApiV2LearningpathsLearningpathIdCopy({
    client,
    body: {
      ...params,
      copyright,
    },
    path: { learningpath_id: learningpathId },
  }).then(resolveJsonOATS);
}

export async function updateLearningpathStepSeqNo(
  { learningpathId, learningpathStepId, seqNo }: GQLMutationUpdateLearningpathStepSeqNoArgs,
  _context: Context,
): Promise<GQLLearningpathSeqNo> {
  return putLearningpathApiV2LearningpathsLearningpathIdLearningstepsLearningstepIdSeqno({
    client,
    body: { seqNo },
    path: {
      learningpath_id: learningpathId,
      learningstep_id: learningpathStepId,
    },
  }).then(resolveJsonOATS);
}
