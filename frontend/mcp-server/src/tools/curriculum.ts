/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import type { GrepResultDTO } from "@ndla/types-backend/search-api";
import * as z from "zod";
import { searchApi } from "../api/clients";
import {
  languageSchema,
  pageSchema,
  pageSizeSchema,
  readOnlyAnnotations,
  ToolInputError,
  withToolHandling,
} from "./tool";

const formatGrepResult = (result: GrepResultDTO): string => {
  const status = result.status === "Published" ? "" : ` [${result.status}]`;
  switch (result.typename) {
    case "GrepKompetansemaalDTO": {
      const coreElements = result.kjerneelementer.map((k) => `${k.code} ${k.title}`).join("; ");
      const topics = result.tverrfagligeTemaer.map((t) => `${t.code} ${t.title.title}`).join("; ");
      return [
        `- **${result.code}**${status} competence goal: ${result.title.title}`,
        `  Curriculum: ${result.laereplan.code} ${result.laereplan.title} · Set: ${result.kompetansemaalSett.title}`,
        coreElements ? `  Core elements: ${coreElements}` : undefined,
        topics ? `  Interdisciplinary topics: ${topics}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
    }
    case "GrepKjerneelementDTO":
      return [
        `- **${result.code}**${status} core element: ${result.title.title}`,
        `  Curriculum: ${result.laereplan.code} ${result.laereplan.title}`,
        result.description.description ? `  ${result.description.description}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
    case "GrepTverrfagligTemaDTO":
      return `- **${result.code}**${status} interdisciplinary topic: ${result.title.title}`;
    case "GrepLaererplanDTO":
      return `- **${result.code}**${status} curriculum: ${result.title.title}`;
    case "GrepKompetansemaalSettDTO":
      return `- **${result.code}**${status} competence goal set: ${result.title.title} (${result.kompetansemaal.length} goals)`;
    case "GrepFagkodeDTO":
      return `- **${result.code}**${status} subject code: ${result.title.title} (${result.kortform.title})`;
    default:
      return `- ${(result as { code?: string }).code ?? "Unknown curriculum element"}`;
  }
};

const inputSchema = z.object({
  query: z.string().trim().min(1).max(200).optional().describe("Words to search for in curriculum titles (Norwegian)."),
  codes: z
    .array(z.string().regex(/^[A-Z]+[0-9A-Z-]*$/))
    .max(20)
    .optional()
    .describe("Look up specific codes, e.g. KM1234, KE123, TT2 or NAT01-04."),
  types: z
    .array(z.enum(["KM", "KE", "TT", "KV"]))
    .optional()
    .describe(
      "Only return codes with these prefixes: KM (competence goals), KE (core elements), TT (interdisciplinary topics), KV (competence goal sets).",
    ),
  language: languageSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const registerCurriculumTool = (server: McpServer) => {
  server.registerTool(
    "search_curriculum",
    {
      title: "Search the Norwegian curriculum (GREP)",
      description:
        "Search the national curriculum (LK20, from Udir's GREP): competence goals (kompetansemål), core elements (kjerneelementer), interdisciplinary topics and curricula. Pass the returned codes as grepCodes to search to find NDLA resources that cover them. Prefer elements with status Published; others are expired or in progress.",
      inputSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("search_curriculum", async ({ query, codes, types, language, page, pageSize }) => {
      if (!query && !codes?.length) throw new ToolInputError("Provide a query or one or more codes.");
      const result = await searchApi
        .POST("/search-api/v1/search/grep", {
          body: { query, codes, prefixFilter: types, language, page, pageSize },
        })
        .then(resolveJsonOATS);
      if (!result.results.length) return "No curriculum elements found.";
      return [`Found ${result.totalCount} curriculum elements.`, result.results.map(formatGrepResult).join("\n")].join(
        "\n\n",
      );
    }),
  );
};
