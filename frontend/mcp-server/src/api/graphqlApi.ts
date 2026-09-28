/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApiError } from "@ndla/api-client";
import { graphqlApiUrl } from "../config";
import { getCached, isCacheableResponse, setCached } from "./cache";
import { anonymousFetch } from "./clients";

const transformedArticleQuery = `
  query mcpTransformedArticle($id: String!) {
    article(id: $id) {
      transformedContent(transformArgs: { absoluteUrl: true, showVisualElement: "true" }) {
        content
      }
    }
  }
`;

interface TransformedArticleResponse {
  data?: { article?: { transformedContent?: { content: string } } | null };
  errors?: { message: string }[];
}

/** Article HTML where every `<ndlaembed>` carries its resolved metadata in `data-json`. */
export const fetchTransformedArticleContent = async (id: number, language: string): Promise<string | undefined> => {
  const cacheKey = `graphql:article:${id}:${language}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const response = await anonymousFetch(
    new Request(graphqlApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "accept-language": language },
      body: JSON.stringify({ query: transformedArticleQuery, variables: { id: `${id}` } }),
    }),
  );
  const json = (await response.json()) as TransformedArticleResponse;
  if (!response.ok || json.errors?.length) {
    throw new ApiError({
      status: response.ok ? 502 : response.status,
      messages: json.errors?.map((e) => e.message).join(", ") ?? "",
      json,
      url: graphqlApiUrl,
      statusText: response.statusText,
    });
  }

  const content = json.data?.article?.transformedContent?.content;
  if (content !== undefined && isCacheableResponse(response)) setCached(cacheKey, content);
  return content;
};
