/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ndlaUrl } from "../config";

export const toNdlaUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${ndlaUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export const articleUrl = (id: number | string) => `${ndlaUrl}/article/${id}`;
export const learningpathUrl = (id: number | string, stepId?: number | string) =>
  `${ndlaUrl}/learningpaths/${id}${stepId ? `/steps/${stepId}` : ""}`;
export const conceptUrl = (id: number | string) => `${ndlaUrl}/concept/${id}`;
export const imagePageUrl = (id: number | string) => `${ndlaUrl}/image/${id}`;
export const audioPageUrl = (id: number | string) => `${ndlaUrl}/audio/${id}`;
export const videoPageUrl = (id: string) => `${ndlaUrl}/video/${id}`;

export const sizedImageUrl = (imageUrl: string, width = 1024) => {
  const url = new URL(imageUrl);
  url.searchParams.set("width", `${width}`);
  return url.toString();
};
