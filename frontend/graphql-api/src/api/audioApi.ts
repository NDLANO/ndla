/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type AudioMetaInformationDTO,
  type AudioSummarySearchResultDTO,
  type SeriesDTO,
  type SeriesSummarySearchResultDTO,
  getAudioApiV1Audio,
  getAudioApiV1AudioAudioId,
  getAudioApiV1Series,
  getAudioApiV1SeriesSeriesId,
} from "@ndla/types-backend/audio-api";
import { createClient } from "@ndla/types-backend/audio-api/client";
import { apiClientConfig, resolveJsonOATS } from "../utils/api-client/utils";
import { getNumberIdOrThrow } from "../utils/apiHelpers";

const client = createClient(apiClientConfig());

export async function fetchAudio(context: Context, audioId: number | string): Promise<AudioMetaInformationDTO | null> {
  const response = await getAudioApiV1AudioAudioId({
    client,
    path: {
      "audio-id": getNumberIdOrThrow(audioId),
    },
    query: {
      language: context.language,
    },
  });
  try {
    return await resolveJsonOATS(response);
  } catch (e) {
    return null;
  }
}

export async function fetchAudioV2(context: Context, audioId: number | string): Promise<AudioMetaInformationDTO> {
  return getAudioApiV1AudioAudioId({
    client,
    path: {
      "audio-id": getNumberIdOrThrow(audioId),
    },
    query: {
      language: context.language,
    },
  }).then(resolveJsonOATS);
}

export async function fetchPodcastsPage(
  context: Context,
  pageSize: number,
  page: number,
  fallback: boolean,
): Promise<AudioSummarySearchResultDTO> {
  return getAudioApiV1Audio({
    client,
    query: {
      "page-size": pageSize,
      page,
      "audio-type": "podcast",
      language: context.language,
      fallback,
    },
  }).then(resolveJsonOATS);
}

export async function fetchPodcastSeries(context: Context, podcastId: number): Promise<SeriesDTO> {
  return getAudioApiV1SeriesSeriesId({
    client,
    path: {
      "series-id": podcastId,
    },
    query: { language: context.language },
  }).then(resolveJsonOATS);
}

export async function fetchPodcastSeriesPage(
  context: Context,
  pageSize: number,
  page: number,
  fallback: boolean,
): Promise<SeriesSummarySearchResultDTO> {
  return getAudioApiV1Series({
    client,
    query: {
      "page-size": pageSize,
      page,
      language: context.language,
      fallback,
    },
  }).then(resolveJsonOATS);
}
