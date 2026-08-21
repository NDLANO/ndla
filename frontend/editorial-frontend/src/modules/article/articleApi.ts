/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type ArticleV2DTO,
  type SearchResultV2DTO,
  getArticleApiV2Articles,
  getArticleApiV2ArticlesArticleId,
} from "@ndla/types-backend/article-api";
import { createClient } from "@ndla/types-backend/article-api/client";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveJsonOATS } from "../../util/resolveJsonOrRejectWithError";

const client = createClient(apiClientConfig());

export interface ArticleSearchParams {
  query?: string;
  language?: string;
  articleTypes?: string[];
  ids?: number[];
  license?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export const searchArticles = (params?: ArticleSearchParams): Promise<SearchResultV2DTO> =>
  getArticleApiV2Articles({ client, query: params }).then((r) => resolveJsonOATS(r));

export const getArticle = (id: number, locale: string = "nb"): Promise<ArticleV2DTO> =>
  getArticleApiV2ArticlesArticleId({
    client,
    path: {
      article_id: id.toString(),
    },
    query: {
      fallback: true,
      language: locale,
    },
  }).then((r) => resolveJsonOATS(r));
