/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCorrelationId } from "@ndla/server";
import type { paths as ArticlePaths } from "@ndla/types-backend/article-api";
import type { paths as AudioPaths } from "@ndla/types-backend/audio-api";
import type { paths as ConceptPaths } from "@ndla/types-backend/concept-api";
import type { paths as ImagePaths } from "@ndla/types-backend/image-api";
import type { paths as LearningpathPaths } from "@ndla/types-backend/learningpath-api";
import type { paths as SearchPaths } from "@ndla/types-backend/search-api";
import type { paths as TaxonomyPaths } from "@ndla/types-backend/taxonomy-api";
import createClient from "openapi-fetch";
import { apiUrl, requestTimeoutMs } from "../config";
import { cacheMiddleware } from "./cache";

/** Every backend call is anonymous: no auth headers are ever forwarded, so only content available to everyone is returned. */
export const anonymousFetch = async (request: Request): Promise<Response> => {
  const headers = new Headers(request.headers);
  headers.delete("authorization");
  headers.delete("feideauthorization");
  const correlationId = getCorrelationId();
  if (correlationId) headers.set("x-correlation-id", correlationId);
  return globalThis.fetch(new Request(request, { headers, signal: AbortSignal.timeout(requestTimeoutMs) }));
};

const createApiClient = <Paths extends {}>(baseUrl: string = apiUrl) => {
  const client = createClient<Paths>({
    baseUrl,
    fetch: anonymousFetch,
    querySerializer: { array: { style: "form", explode: false } },
  });
  client.use(cacheMiddleware);
  return client;
};

export const articleApi = createApiClient<ArticlePaths>();
export const audioApi = createApiClient<AudioPaths>();
export const conceptApi = createApiClient<ConceptPaths>();
export const imageApi = createApiClient<ImagePaths>();
export const learningpathApi = createApiClient<LearningpathPaths>();
export const searchApi = createApiClient<SearchPaths>();
export const taxonomyApi = createApiClient<TaxonomyPaths>(`${apiUrl}/taxonomy`);
