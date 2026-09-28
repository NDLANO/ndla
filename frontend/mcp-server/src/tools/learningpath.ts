/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import type { LearningStepV2DTO } from "@ndla/types-backend/learningpath-api";
import * as z from "zod";
import { learningpathApi } from "../api/clients";
import { creditLine } from "../format/credits";
import { articleUrl, learningpathUrl } from "../format/links";
import { htmlToMarkdown } from "../format/markdown";
import { languageSchema, readOnlyAnnotations, truncate, withToolHandling } from "./tool";

const maxStepTextLength = 2000;

const formatStep = (learningpathId: number, step: LearningStepV2DTO, requestedStepId?: number): string => {
  const marker = step.id === requestedStepId ? " (requested step)" : "";
  const text = htmlToMarkdown(step.introduction?.introduction ?? step.description?.description);
  const content = step.articleId
    ? `Article id ${step.articleId} (${articleUrl(step.articleId)})`
    : step.embedUrl?.url
      ? `Link: ${step.embedUrl.url}`
      : undefined;
  return [
    `${step.seqNo + 1}. **${step.title.title}**${marker} — ${step.type.toLowerCase()}`,
    text ? truncate(text, maxStepTextLength).replace(/^/gm, "   ") : undefined,
    content ? `   ${content}` : undefined,
    `   URL: ${learningpathUrl(learningpathId, step.id)}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export const renderLearningpath = async (id: number, language: string, requestedStepId?: number): Promise<string> => {
  const learningpath = await learningpathApi
    .GET("/learningpath-api/v2/learningpaths/{learningpath_id}", {
      params: { path: { learningpath_id: id }, query: { language, fallback: true } },
    })
    .then(resolveJsonOATS);

  const { copyright } = learningpath;
  const details = [
    `- Learning path id: ${learningpath.id}`,
    `- URL: ${learningpathUrl(learningpath.id)}`,
    `- ${creditLine({ copyright: { license: copyright.license, creators: copyright.contributors } })}`,
    learningpath.duration ? `- Estimated duration: ${learningpath.duration} minutes` : undefined,
    `- Updated: ${learningpath.lastUpdated.slice(0, 10)}`,
    learningpath.grepCodes.length ? `- Curriculum codes: ${learningpath.grepCodes.join(", ")}` : undefined,
    `- Languages: ${learningpath.supportedLanguages.join(", ")}`,
  ].filter(Boolean);

  const steps = [...learningpath.learningsteps]
    .sort((a, b) => a.seqNo - b.seqNo)
    .map((step) => formatStep(learningpath.id, step, requestedStepId));

  return [
    `# ${learningpath.title.title}`,
    htmlToMarkdown(learningpath.introduction?.introduction) || learningpath.description.description,
    details.join("\n"),
    `## Steps (${steps.length})`,
    steps.join("\n\n"),
    "Read article steps with get_article.",
  ]
    .filter(Boolean)
    .join("\n\n");
};

const inputSchema = z.object({
  id: z.number().int().positive().describe("Learning path id, e.g. from search results."),
  language: languageSchema,
});

export const registerLearningpathTool = (server: McpServer) => {
  server.registerTool(
    "get_learningpath",
    {
      title: "Read NDLA learning path",
      description:
        "Get an NDLA learning path (læringssti): a sequence of steps with texts, articles and links, plus license and attribution.",
      inputSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("get_learningpath", ({ id, language }) => renderLearningpath(id, language)),
  );
};
