/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS, resolveOATS } from "@ndla/api-client";
import {
  deleteAudioApiV1AudioAudioIdLanguageLanguage,
  deleteAudioApiV1SeriesSeriesIdLanguageLanguage,
  getAudioApiV1AudioAudioId,
  getAudioApiV1AudioTagSearch,
  getAudioApiV1SeriesSeriesId,
  getAudioApiV1TranscriptionAudioAudioidLanguage,
  postAudioApiV1Audio,
  postAudioApiV1AudioSearch,
  postAudioApiV1Series,
  postAudioApiV1SeriesSearch,
  postAudioApiV1TranscriptionAudioAudionameAudioidLanguage,
  putAudioApiV1AudioAudioId,
  putAudioApiV1SeriesSeriesId,
  type AudioMetaInformationDTO,
  type AudioSummarySearchResultDTO,
  type SeriesSummarySearchResultDTO,
  type SeriesDTO,
  type NewSeriesDTO,
  type TagsSearchResultDTO,
  type SeriesSearchParamsDTO,
  type SearchParamsDTO,
  type TranscriptionResultDTO,
  type NewAudioMetaInformationDTO,
  type UpdatedAudioMetaInformationDTO,
  type GetAudioApiV1AudioAudioIdData,
} from "@ndla/types-backend/audio-api";
import { createClient } from "@ndla/types-backend/audio-api/client";
import { authClientConfig } from "../../util/apiHelpers";
import { createFormData } from "../../util/formDataHelper";

const client = createClient(authClientConfig());

export const postAudio = (metadata: NewAudioMetaInformationDTO, file: Blob): Promise<AudioMetaInformationDTO> =>
  postAudioApiV1Audio({
    client,
    body: {
      metadata,
      file,
    },
    bodySerializer() {
      return createFormData(file, metadata);
    },
  }).then((r) => resolveJsonOATS(r));

export const fetchAudio = async (id: number, locale?: string): Promise<AudioMetaInformationDTO> =>
  getAudioApiV1AudioAudioId({
    client,
    path: {
      "audio-id": id,
    },
    query: {
      language: locale,
      fallback: true,
    } as GetAudioApiV1AudioAudioIdData["query"],
  }).then((r) => resolveJsonOATS(r));

export const updateAudio = async (
  id: number,
  metadata: UpdatedAudioMetaInformationDTO,
  file: Blob | undefined,
): Promise<AudioMetaInformationDTO> =>
  putAudioApiV1AudioAudioId({
    client,
    path: {
      "audio-id": id,
    },
    body: {
      metadata,
      file,
    },
    bodySerializer() {
      return createFormData(file, metadata);
    },
  }).then((r) => resolveJsonOATS(r));

export const postSearchAudio = async (body: SearchParamsDTO): Promise<AudioSummarySearchResultDTO> =>
  postAudioApiV1AudioSearch({ client, body }).then((r) => resolveJsonOATS(r));

export const deleteLanguageVersionAudio = async (
  audioId: number,
  locale: string,
): Promise<AudioMetaInformationDTO | void> =>
  deleteAudioApiV1AudioAudioIdLanguageLanguage({ client, path: { "audio-id": audioId, language: locale } }).then((r) =>
    resolveOATS(r),
  );

export const deleteLanguageVersionSeries = async (seriesId: number, language: string): Promise<SeriesDTO | void> =>
  deleteAudioApiV1SeriesSeriesIdLanguageLanguage({ client, path: { "series-id": seriesId, language } }).then((r) =>
    resolveOATS(r),
  );

export const fetchSearchTags = async (query: string, language: string): Promise<TagsSearchResultDTO> =>
  getAudioApiV1AudioTagSearch({ client, query: { language, query } }).then((r) => resolveJsonOATS(r));

export const fetchSeries = async (id: number, language?: string): Promise<SeriesDTO> =>
  getAudioApiV1SeriesSeriesId({ client, path: { "series-id": id }, query: { language } }).then((r) =>
    resolveJsonOATS(r),
  );

export const postSeries = async (newSeries: NewSeriesDTO): Promise<SeriesDTO> =>
  postAudioApiV1Series({ client, body: newSeries }).then((r) => resolveJsonOATS(r));

export const updateSeries = (id: number, newSeries: NewSeriesDTO): Promise<SeriesDTO> =>
  putAudioApiV1SeriesSeriesId({ client, path: { "series-id": id }, body: newSeries }).then((r) => resolveJsonOATS(r));

export const postSearchSeries = async (body: SeriesSearchParamsDTO): Promise<SeriesSummarySearchResultDTO> =>
  postAudioApiV1SeriesSearch({ client, body: body }).then((r) => resolveJsonOATS(r));

export const postAudioTranscription = async (audioName: string, audioId: number, language: string): Promise<void> => {
  await postAudioApiV1TranscriptionAudioAudionameAudioidLanguage({
    client,
    path: { audioName, audioId, language },
  }).then((r) => resolveOATS(r));
};

export const fetchAudioTranscription = async (audioId: number, language: string): Promise<TranscriptionResultDTO> =>
  getAudioApiV1TranscriptionAudioAudioidLanguage({ client, path: { audioId, language } }).then((r) =>
    resolveJsonOATS(r),
  );
