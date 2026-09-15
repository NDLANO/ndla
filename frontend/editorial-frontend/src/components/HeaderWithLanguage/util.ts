/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ArticleDTO } from "@ndla/types-backend/draft-api";
import type { Node } from "@ndla/types-backend/taxonomy-api";
import { isEqual, get } from "lodash-es";
import type { FlatArticleKeys } from "../../containers/ArticlePage/components/types";
import { removeCommentTags } from "../../util/compareHTMLHelpers";
import {
  toEditAudio,
  toEditConcept,
  toEditFrontPageArticle,
  toEditGloss,
  toEditImage,
  toEditLearningResource,
  toEditPodcast,
  toEditPodcastSeries,
  toEditTopicArticle,
  toLearningpath,
} from "../../util/routeHelpers";

export const getTaxonomyPathsFromTaxonomy = (taxonomy?: Pick<Node, "paths">[], articleId?: number): string[] => {
  const taxPaths = taxonomy?.flatMap((t) => t.paths) ?? [];
  const articlePath = articleId ? `/article/${articleId}` : undefined;
  const paths = articlePath ? taxPaths.concat(articlePath) : taxPaths;
  return paths.filter((p): p is string => p !== undefined);
};

export const toMapping = {
  concept: toEditConcept,
  gloss: toEditGloss,
  audio: toEditAudio,
  "podcast-series": toEditPodcastSeries,
  podcast: toEditPodcast,
  image: toEditImage,
  "frontpage-article": toEditFrontPageArticle,
  standard: toEditLearningResource,
  "topic-article": toEditTopicArticle,
  learningpath: toLearningpath,
};

export type TranslatableType = keyof typeof toMapping;

export const translatableTypes: TranslatableType[] = [
  "audio",
  "concept",
  "gloss",
  "standard",
  "topic-article",
  "podcast",
  "image",
  "podcast-series",
  "frontpage-article",
];

export const createEditUrl = (id: number, locale: string, type: keyof typeof toMapping) => {
  return toMapping[type](id, locale);
};

const withoutCommentTags = (value: unknown): unknown => (typeof value === "string" ? removeCommentTags(value) : value);

export const hasArticleFieldsChanged = (
  current: ArticleDTO | undefined,
  lastPublished: ArticleDTO | undefined,
  fields: FlatArticleKeys[],
): boolean => {
  if (current === undefined || lastPublished === undefined) return false;
  for (const field of fields) {
    // FlatArticleKeys addresses object-valued fields such as `copyright` too, so only the
    // string ones get their comment tags stripped; the rest are compared as they are.
    const currentField: unknown = get(current, field, "");
    const lastPublishedField: unknown = get(lastPublished, field, "");

    if (!isEqual(withoutCommentTags(currentField), withoutCommentTags(lastPublishedField))) return true;
  }
  return false;
};
