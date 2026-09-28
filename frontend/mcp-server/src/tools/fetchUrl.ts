/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import * as z from "zod";
import { taxonomyApi } from "../api/clients";
import { defaultLanguage } from "../config";
import { videoPageUrl } from "../format/links";
import { type NdlaUrlTarget, parseNdlaUrl } from "../format/ndlaUrl";
import { unreachable } from "../utils/unreachable";
import { renderArticle } from "./article";
import { renderConcepts } from "./concepts";
import { renderLearningpath } from "./learningpath";
import { renderAudio, renderImage, renderPodcastSeries } from "./media";
import { renderNode } from "./taxonomy";
import { ToolInputError, optionalLanguageSchema, readOnlyAnnotations, withToolHandling } from "./tool";

const renderContext = async (contextId: string, language: string, stepId?: number): Promise<string> => {
  const [node] = await taxonomyApi
    .GET("/v1/nodes", { params: { query: { contextId, language, includeContexts: true } } })
    .then(resolveJsonOATS);
  if (!node) throw new ToolInputError(`No NDLA page found for context ${contextId}.`);

  const [, type, id] = node.contentUri?.match(/^urn:(article|learningpath):(\d+)$/) ?? [];
  if (node.nodeType === "RESOURCE" && type === "article") return renderArticle(Number(id), language);
  if (node.nodeType === "RESOURCE" && type === "learningpath") return renderLearningpath(Number(id), language, stepId);
  return renderNode(node.id, language);
};

const renderTarget = (target: NdlaUrlTarget, language: string): Promise<string> => {
  switch (target.kind) {
    case "article":
      return renderArticle(target.id, language);
    case "learningpath":
      return renderLearningpath(target.id, language, target.stepId);
    case "concept":
      return renderConcepts({ ids: [target.id], language, page: 1, pageSize: 1 });
    case "image":
      return renderImage(target.id, language);
    case "audio":
      return renderAudio(target.id, language);
    case "podcast-series":
      return renderPodcastSeries(target.id, language);
    case "video":
      return Promise.resolve(
        `This is an NDLA video (${videoPageUrl(target.id)}). Videos can't be read as text; search for the article that embeds it instead.`,
      );
    case "context":
      return renderContext(target.contextId, language, target.stepId);
    default:
      return unreachable(target);
  }
};

const inputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .describe("A link to ndla.no, e.g. https://ndla.no/r/naturfag/fotosyntese/ae19d59d02"),
  language: optionalLanguageSchema.describe("Content language. Defaults to the language in the URL, or nb."),
});

export const registerFetchUrlTool = (server: McpServer) => {
  server.registerTool(
    "fetch_ndla_url",
    {
      title: "Open an ndla.no link",
      description:
        "Read the content behind an ndla.no URL: articles, learning paths, subject and topic pages, concepts, images and audio. Use this when the user shares an NDLA link.",
      inputSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("fetch_ndla_url", ({ url, language }) => {
      const parsed = parseNdlaUrl(url);
      if (!parsed) throw new ToolInputError("Not a recognised ndla.no content URL.");
      return renderTarget(parsed.target, language ?? parsed.language ?? defaultLanguage);
    }),
  );
};
