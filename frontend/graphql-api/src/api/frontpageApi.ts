/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type FrontPageDTO,
  type FilmFrontPageDTO,
  type SubjectPageDTO,
  getFrontpageApiV1Filmfrontpage,
  getFrontpageApiV1Frontpage,
  getFrontpageApiV1SubjectpageIds,
  getFrontpageApiV1SubjectpageSubjectpageId,
} from "@ndla/types-backend/frontpage-api";
import { createClient } from "@ndla/types-backend/frontpage-api/client";
import { apiClientConfig, resolveJsonOATS } from "../utils/api-client/utils";

const client = createClient(apiClientConfig());

export interface IMovieMeta {
  title: string;
  metaDescription?: string;
  metaImage?: {
    url: string;
    alt: string;
    language: string;
  };
}

export async function fetchFrontpage(_context: Context): Promise<FrontPageDTO> {
  return getFrontpageApiV1Frontpage({ client }).then(resolveJsonOATS);
}

export async function fetchSubjectPage(subjectPageId: number, context: Context): Promise<SubjectPageDTO> {
  return getFrontpageApiV1SubjectpageSubjectpageId({
    client,
    path: {
      "subjectpage-id": subjectPageId,
    },
    query: {
      language: context.language,
      fallback: true,
    },
  }).then(resolveJsonOATS);
}

export async function fetchSubjectPages(ids: readonly number[], context: Context): Promise<SubjectPageDTO[]> {
  return getFrontpageApiV1SubjectpageIds({
    client,
    query: {
      ids: ids.slice(),
      language: context.language,
      "page-size": ids.length,
      fallback: true,
    },
  }).then(resolveJsonOATS);
}

export async function fetchFilmFrontpage(_context: Context): Promise<FilmFrontPageDTO> {
  return getFrontpageApiV1Filmfrontpage({ client }).then(resolveJsonOATS);
}
