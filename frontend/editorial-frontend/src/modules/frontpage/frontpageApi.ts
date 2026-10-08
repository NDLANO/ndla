/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS } from "@ndla/api-client";
import {
  deleteFrontpageApiV1FilmfrontpageLanguageLanguage,
  deleteFrontpageApiV1SubjectpageSubjectpageIdLanguageLanguage,
  getFrontpageApiV1Filmfrontpage,
  getFrontpageApiV1Frontpage,
  getFrontpageApiV1SubjectpageSubjectpageId,
  patchFrontpageApiV1SubjectpageSubjectpageId,
  postFrontpageApiV1Filmfrontpage,
  postFrontpageApiV1Frontpage,
  postFrontpageApiV1Subjectpage,
  type SubjectPageDTO,
  type FilmFrontPageDTO,
  type NewSubjectPageDTO,
  type UpdatedSubjectPageDTO,
  type NewOrUpdatedFilmFrontPageDTO,
  type FrontPageDTO,
} from "@ndla/types-backend/frontpage-api";
import { createClient } from "@ndla/types-backend/frontpage-api/client";
import type { LocaleType } from "../../interfaces";
import { authClientConfig } from "../../util/apiHelpers";

const client = createClient(authClientConfig());

export const fetchFrontpage = () => getFrontpageApiV1Frontpage({ client }).then(resolveJsonOATS);

export const postFrontpage = (body: FrontPageDTO) =>
  postFrontpageApiV1Frontpage({ client, body }).then(resolveJsonOATS);

export const fetchFilmFrontpage = () => getFrontpageApiV1Filmfrontpage({ client }).then(resolveJsonOATS);

export const updateFilmFrontpage = (filmfrontpage: NewOrUpdatedFilmFrontPageDTO): Promise<FilmFrontPageDTO> =>
  postFrontpageApiV1Filmfrontpage({ client, body: filmfrontpage }).then(resolveJsonOATS);

export const fetchSubjectpage = (id: number, language: LocaleType): Promise<SubjectPageDTO> =>
  getFrontpageApiV1SubjectpageSubjectpageId({
    client,
    path: { "subjectpage-id": id },
    query: { language, fallback: true },
  }).then(resolveJsonOATS);

export const updateSubjectpage = (
  subjectpage: UpdatedSubjectPageDTO,
  subjectpageId: number,
  language: LocaleType,
): Promise<SubjectPageDTO> =>
  patchFrontpageApiV1SubjectpageSubjectpageId({
    client,
    path: { "subjectpage-id": subjectpageId },
    query: { language },
    body: subjectpage,
  }).then(resolveJsonOATS);

export const createSubjectpage = (body: NewSubjectPageDTO): Promise<SubjectPageDTO> =>
  postFrontpageApiV1Subjectpage({ client, body }).then(resolveJsonOATS);

export const deleteSubectPageLanguageVersion = (subjectPageId: number, language: string): Promise<SubjectPageDTO> =>
  deleteFrontpageApiV1SubjectpageSubjectpageIdLanguageLanguage({
    client,
    path: {
      "subjectpage-id": subjectPageId,
      language,
    },
  }).then(resolveJsonOATS);

export const deleteFilmFrontPageLanguageVersion = (language: string): Promise<FilmFrontPageDTO> =>
  deleteFrontpageApiV1FilmfrontpageLanguageLanguage({ client, path: { language } }).then(resolveJsonOATS);
