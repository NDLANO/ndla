/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import type { MultiSearchSummaryDTO, MultiSummaryBaseDTO, NodeHitDTO } from "@ndla/types-backend/search-api";
import * as z from "zod";
import { searchApi } from "../api/clients";
import { formatLicense } from "../format/credits";
import { articleUrl, learningpathUrl, toNdlaUrl } from "../format/links";
import { languageSchema, pageSchema, pageSizeSchema, readOnlyAnnotations, withToolHandling } from "./tool";

const contentTypes = {
  article: "standard",
  "topic-article": "topic-article",
  learningpath: "learningpath",
} as const;

const inputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe("Free-text query. Norwegian terms give the best results."),
  contentType: z
    .enum(["article", "topic-article", "learningpath"])
    .optional()
    .describe("Only return articles, topic introductions or learning paths."),
  resourceTypes: z
    .array(z.string().startsWith("urn:resourcetype:"))
    .max(10)
    .optional()
    .describe(
      "Filter by resource type: urn:resourcetype:subjectMaterial (Fagstoff), urn:resourcetype:tasksAndActivities (Oppgave), urn:resourcetype:reviewResource (Vurderingsressurs), urn:resourcetype:sourceMaterial (Kildemateriell), urn:resourcetype:concept (Forklaringsartikkel), urn:resourcetype:learningPath (Læringssti), urn:resourcetype:game (Spill), urn:resourcetype:documentary, urn:resourcetype:shortFilm, urn:resourcetype:featureFilm, urn:resourcetype:series.",
    ),
  subjectIds: z
    .array(z.string().startsWith("urn:subject:"))
    .max(10)
    .optional()
    .describe("Limit to subjects, using ids from list_subjects."),
  grepCodes: z
    .array(z.string().regex(/^[A-Z]+[0-9A-Z-]*$/))
    .max(20)
    .optional()
    .describe("Curriculum codes from search_curriculum, e.g. KM1234 (competence goal), KE123 (core element), TT2."),
  language: languageSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
});

const isNodeHit = (result: MultiSummaryBaseDTO): result is NodeHitDTO => result.typename === "NodeHitDTO";

const formatSummary = (result: MultiSearchSummaryDTO, index: number): string => {
  const isLearningpath = result.learningResourceType === "learningpath";
  const url = toNdlaUrl(result.context?.url) ?? (isLearningpath ? learningpathUrl(result.id) : articleUrl(result.id));
  const types = result.resourceTypes.map((t) => t.name).join(", ");
  const breadcrumbs = result.context?.breadcrumbs.join(" › ");
  const heading = [types, breadcrumbs].filter(Boolean).join(" · ");
  const idLabel = isLearningpath
    ? `Learning path id ${result.id}`
    : `${result.learningResourceType === "topic-article" ? "Topic article" : "Article"} id ${result.id}`;
  const license = formatLicense(result.license);
  const lines = [
    `${index}. **${result.title.title}**${heading ? ` — ${heading}` : ""}`,
    result.metaDescription.metaDescription ? `   ${result.metaDescription.metaDescription}` : undefined,
    `   ${[idLabel, license ? `License: ${license}` : undefined, `URL: ${url}`].filter(Boolean).join(" · ")}`,
  ];
  return lines.filter(Boolean).join("\n");
};

const formatNodeHit = (result: NodeHitDTO, index: number): string => {
  const url = toNdlaUrl(result.url ?? result.context?.url);
  return `${index}. **${result.title}** — node ${result.id}${url ? ` · URL: ${url}` : ""}`;
};

export const registerSearchTool = (server: McpServer) => {
  server.registerTool(
    "search",
    {
      title: "Search NDLA",
      description:
        "Search NDLA's published learning resources (articles, topic introductions and learning paths) for Norwegian upper secondary school. Returns titles, descriptions, subject placement, ids, license and ndla.no URLs. Read a result with get_article or get_learningpath.",
      inputSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling(
      "search",
      async ({ query, contentType, resourceTypes, subjectIds, grepCodes, language, page, pageSize }) => {
        const result = await searchApi
          .GET("/search-api/v1/search", {
            params: {
              query: {
                query,
                language,
                fallback: true,
                page,
                "page-size": pageSize,
                "context-types": contentType ? [contentTypes[contentType]] : undefined,
                "resource-types": resourceTypes,
                subjects: subjectIds,
                "grep-codes": grepCodes,
                "filter-inactive": true,
              },
            },
          })
          .then(resolveJsonOATS);

        if (!result.results.length) {
          return `No results${query ? ` for "${query}"` : ""}. Try other (Norwegian) terms or fewer filters.`;
        }
        const offset = (page - 1) * pageSize;
        const items = result.results.map((r, i) =>
          isNodeHit(r) ? formatNodeHit(r, offset + i + 1) : formatSummary(r, offset + i + 1),
        );
        const header = `Found ${result.totalCount} results${query ? ` for "${query}"` : ""} (showing ${offset + 1}-${offset + items.length}).`;
        return [header, ...items].join("\n\n");
      },
    ),
  );
};
