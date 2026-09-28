/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import type { ConceptSummaryDTO } from "@ndla/types-backend/concept-api";
import * as z from "zod";
import { conceptApi } from "../api/clients";
import { creditLine } from "../format/credits";
import { conceptUrl } from "../format/links";
import {
  languageSchema,
  pageSchema,
  pageSizeSchema,
  readOnlyAnnotations,
  ToolInputError,
  withToolHandling,
} from "./tool";

const formatConcept = (concept: ConceptSummaryDTO): string => {
  const gloss = concept.glossData;
  const glossLines = gloss
    ? [
        `Gloss: ${gloss.gloss} (${gloss.originalLanguage}${gloss.wordClass.length ? `, ${gloss.wordClass.join(", ")}` : ""})`,
        ...gloss.examples
          .flat()
          .slice(0, 3)
          .map((e) => `Example (${e.language}): ${e.example}`),
      ]
    : [];
  return [
    `### ${concept.title.title} (${concept.conceptTypeName}, id ${concept.id})`,
    concept.content.content,
    ...glossLines,
    creditLine({ copyright: concept.copyright, license: concept.license, source: conceptUrl(concept.id) }),
  ]
    .filter(Boolean)
    .join("\n");
};

interface ConceptQuery {
  query?: string;
  ids?: number[];
  language: string;
  page: number;
  pageSize: number;
}

export const renderConcepts = async ({ query, ids, language, page, pageSize }: ConceptQuery): Promise<string> => {
  const result = await conceptApi
    .GET("/concept-api/v1/concepts", {
      params: { query: { query, ids, language, fallback: true, page, "page-size": pageSize } },
    })
    .then(resolveJsonOATS);
  if (!result.results.length) return `No concepts found${query ? ` for "${query}"` : ""}.`;
  return [`Found ${result.totalCount} concepts.`, ...result.results.map(formatConcept)].join("\n\n");
};

const inputSchema = z.object({
  query: z.string().trim().min(1).max(200).optional().describe("Term or phrase to look up."),
  ids: z.array(z.number().int().positive()).max(20).optional().describe("Concept ids to fetch directly."),
  language: languageSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const registerConceptTool = (server: McpServer) => {
  server.registerTool(
    "search_concepts",
    {
      title: "Look up NDLA concepts",
      description:
        "Look up NDLA concept explanations (forklaringer) and glossary entries (gloser, for language subjects) by term or id. Returns short definitions with license.",
      inputSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("search_concepts", (args) => {
      if (!args.query && !args.ids?.length) throw new ToolInputError("Provide a query or one or more ids.");
      return renderConcepts(args);
    }),
  );
};
