/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
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
} from "@ndla/types-backend/audio-api";
import { createClient } from "@ndla/types-backend/audio-api/client";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveJsonOATS, resolveOATS } from "../../util/resolveJsonOrRejectWithError";

const client = createClient(apiClientConfig());

export const postAudio = (metadata: NewAudioMetaInformationDTO, file: Blob): Promise<AudioMetaInformationDTO> =>
  postAudioApiV1Audio({
    client,
    body: {
      metadata,
      file,
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
    },
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

/** The endpoint answers with an empty 200, so there is nothing to resolve beyond the status. */
export const postAudioTranscription = async (audioName: string, audioId: number, language: string): Promise<void> => {
  const res = await postAudioApiV1TranscriptionAudioAudionameAudioidLanguage({
    client,
    path: { audioName, audioId, language },
  });
  await resolveOATS(res);
};

export const fetchAudioTranscription = async (audioId: number, language: string): Promise<TranscriptionResultDTO> =>
  getAudioApiV1TranscriptionAudioAudioidLanguage({ client, path: { audioId, language } }).then((r) =>
    resolveJsonOATS(r),
  );
