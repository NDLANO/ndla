/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import type { Node, TaxonomyContext } from "@ndla/types-backend/taxonomy-api";
import * as z from "zod";
import { articleApi, taxonomyApi } from "../api/clients";
import { fetchTransformedArticleContent } from "../api/graphqlApi";
import { creditLine } from "../format/credits";
import { articleUrl, toNdlaUrl } from "../format/links";
import { articleToMarkdown } from "../format/markdown";
import { logger } from "../utils/logger";
import { languageSchema, readOnlyAnnotations, truncate, withToolHandling } from "./tool";

const breadcrumbsFor = (context: TaxonomyContext, language: string): string[] =>
  context.breadcrumbs[language] ?? context.breadcrumbs.nb ?? Object.values(context.breadcrumbs)[0] ?? [];

export const activeContexts = (nodes: Node[]): TaxonomyContext[] =>
  nodes
    .flatMap((node) => node.contexts)
    .filter((context) => context.isActive && !context.isArchived && context.isVisible)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

const fetchArticleContexts = (id: number, language: string): Promise<Node[]> =>
  taxonomyApi
    .GET("/v1/nodes", {
      params: { query: { contentURI: `urn:article:${id}`, language, includeContexts: true, isVisible: true } },
    })
    .then(resolveJsonOATS)
    .catch((error) => {
      logger.warn("Could not fetch taxonomy contexts for article", { id, error: `${error}` });
      return [];
    });

const fetchBody = (id: number, language: string): Promise<string | undefined> =>
  fetchTransformedArticleContent(id, language).catch((error) => {
    logger.warn("Could not fetch transformed article content, falling back to raw content", { id, error: `${error}` });
    return undefined;
  });

export const renderArticle = async (id: number, language: string): Promise<string> => {
  const [article, transformedContent, nodes] = await Promise.all([
    articleApi
      .GET("/article-api/v2/articles/{article_id}", {
        params: { path: { article_id: `${id}` }, query: { language, fallback: true } },
      })
      .then(resolveJsonOATS),
    fetchBody(id, language),
    fetchArticleContexts(id, language),
  ]);

  const contexts = activeContexts(nodes);
  const url = toNdlaUrl(contexts[0]?.url) ?? articleUrl(id);
  const placements = contexts
    .slice(0, 5)
    .map((context) => `${breadcrumbsFor(context, language).join(" › ")} (${toNdlaUrl(context.url)})`);

  const details = [
    `- Article id: ${article.id} (${article.articleType})`,
    `- URL: ${url}`,
    placements.length ? `- Found in: ${placements.join("; ")}` : undefined,
    `- ${creditLine({ copyright: article.copyright })}`,
    `- Updated: ${article.updated.slice(0, 10)}`,
    article.grepCodes.length ? `- Curriculum codes: ${article.grepCodes.join(", ")}` : undefined,
    article.tags.tags.length ? `- Tags: ${article.tags.tags.join(", ")}` : undefined,
    `- Languages: ${article.supportedLanguages.join(", ")}`,
  ].filter(Boolean);

  const body = articleToMarkdown(transformedContent ?? article.content.content);
  const introduction = article.introduction?.introduction;

  return [`# ${article.title.title}`, introduction, details.join("\n"), "---", truncate(body)]
    .filter(Boolean)
    .join("\n\n");
};

const inputSchema = z.object({
  id: z.number().int().positive().describe("Article id, e.g. from search results."),
  language: languageSchema,
});

export const registerArticleTool = (server: McpServer) => {
  server.registerTool(
    "get_article",
    {
      title: "Read NDLA article",
      description:
        "Get the full content of an NDLA article as Markdown, with title, introduction, subject placement, license and attribution. Embedded images, videos and interactive content are shown as links with their own license.",
      inputSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("get_article", ({ id, language }) => renderArticle(id, language)),
  );
};
