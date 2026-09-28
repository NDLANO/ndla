/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import type { AudioMetaInformationDTO } from "@ndla/types-backend/audio-api";
import type { ImageMetaInformationV3DTO } from "@ndla/types-backend/image-api";
import * as z from "zod";
import { audioApi, imageApi } from "../api/clients";
import { creditLine } from "../format/credits";
import { audioPageUrl, imagePageUrl, sizedImageUrl } from "../format/links";
import { htmlToMarkdown } from "../format/markdown";
import { languageSchema, pageSchema, pageSizeSchema, readOnlyAnnotations, truncate, withToolHandling } from "./tool";

const formatImage = (image: ImageMetaInformationV3DTO): string => {
  const dimensions = image.image.dimensions
    ? ` (${image.image.dimensions.width}×${image.image.dimensions.height})`
    : "";
  return [
    `### ${image.title.title} (image id ${image.id})`,
    image.alttext.alttext.trim() ? `Alt text: ${image.alttext.alttext.trim()}` : undefined,
    image.caption.caption.trim() ? `Caption: ${htmlToMarkdown(image.caption.caption)}` : undefined,
    `Image: ${sizedImageUrl(image.image.imageUrl)}${dimensions}`,
    creditLine({ copyright: image.copyright, source: imagePageUrl(image.id) }),
  ]
    .filter(Boolean)
    .join("\n");
};

const formatAudio = (audio: AudioMetaInformationDTO, includeManuscript = false): string => {
  const manuscript = includeManuscript ? htmlToMarkdown(audio.manuscript?.manuscript) : "";
  return [
    `### ${audio.title.title} (${audio.audioType}, audio id ${audio.id})`,
    audio.series ? `Series: ${audio.series.title.title} (series id ${audio.series.id})` : undefined,
    audio.podcastMeta?.introduction ? htmlToMarkdown(audio.podcastMeta.introduction) : undefined,
    `Audio file: ${audio.audioFile.url}`,
    creditLine({ copyright: audio.copyright, source: audioPageUrl(audio.id) }),
    manuscript ? `#### Manuscript\n\n${truncate(manuscript)}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
};

export const renderImage = async (id: number, language: string): Promise<string> => {
  const image = await imageApi
    .GET("/image-api/v3/images/{image_id}", { params: { path: { image_id: id }, query: { language } } })
    .then(resolveJsonOATS);
  return formatImage(image);
};

export const renderAudio = async (id: number, language: string): Promise<string> => {
  const audio = await audioApi
    .GET("/audio-api/v1/audio/{audio-id}", { params: { path: { "audio-id": id }, query: { language } } })
    .then(resolveJsonOATS);
  return formatAudio(audio, true);
};

export const renderPodcastSeries = async (id: number, language: string): Promise<string> => {
  const series = await audioApi
    .GET("/audio-api/v1/series/{series-id}", { params: { path: { "series-id": id }, query: { language } } })
    .then(resolveJsonOATS);
  const episodes = (series.episodes ?? []).map((episode) => `- ${episode.title.title} (audio id ${episode.id})`);
  return [
    `# ${series.title.title} (podcast series id ${series.id})`,
    series.description.description,
    episodes.length ? `## Episodes (${episodes.length})\n\n${episodes.join("\n")}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const imageSchema = z.object({
  query: z.string().trim().min(1).max(200).optional().describe("What the image should show (Norwegian works best)."),
  license: z
    .string()
    .regex(/^[A-Z0-9-]+$/)
    .optional()
    .describe("Only images with this license, e.g. CC-BY-SA-4.0, CC-BY-4.0, CC0-1.0 or PD."),
  language: languageSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
});

const audioSchema = z.object({
  query: z.string().trim().min(1).max(200).optional().describe("Search text (Norwegian works best)."),
  audioType: z.enum(["standard", "podcast"]).optional().describe("Only standard audio clips or podcast episodes."),
  language: languageSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const registerMediaTools = (server: McpServer) => {
  server.registerTool(
    "search_images",
    {
      title: "Search NDLA images",
      description:
        "Search NDLA's image archive. Returns image URLs, alt text, captions, license and attribution. Check each license before reuse; COPYRIGHTED and NC/ND images have restrictions.",
      inputSchema: imageSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("search_images", async ({ query, license, language, page, pageSize }) => {
      const result = await imageApi
        .GET("/image-api/v3/images", {
          params: {
            query: {
              query,
              license,
              includeCopyrighted: !license,
              language,
              fallback: true,
              page,
              "page-size": pageSize,
            },
          },
        })
        .then(resolveJsonOATS);
      if (!result.results.length) return "No images found.";
      return [`Found ${result.totalCount} images.`, ...result.results.map(formatImage)].join("\n\n");
    }),
  );

  server.registerTool(
    "search_audio",
    {
      title: "Search NDLA audio and podcasts",
      description:
        "Search NDLA's audio clips and podcast episodes. Returns audio file URLs, series, license and attribution.",
      inputSchema: audioSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("search_audio", async ({ query, audioType, language, page, pageSize }) => {
      const result = await audioApi
        .GET("/audio-api/v1/audio", {
          params: { query: { query, "audio-type": audioType, language, fallback: true, page, "page-size": pageSize } },
        })
        .then(resolveJsonOATS);
      if (!result.results.length) return "No audio found.";
      const details = await audioApi
        .GET("/audio-api/v1/audio/ids", { params: { query: { ids: result.results.map((r) => r.id), language } } })
        .then(resolveJsonOATS);
      const byId = new Map(details.map((audio) => [audio.id, audio]));
      const items = result.results.map((summary) => {
        const audio = byId.get(summary.id);
        return audio
          ? formatAudio(audio)
          : `### ${summary.title.title} (${summary.audioType}, audio id ${summary.id})\n${creditLine({ license: summary.license, source: audioPageUrl(summary.id) })}`;
      });
      return [`Found ${result.totalCount} audio files.`, ...items].join("\n\n");
    }),
  );
};
