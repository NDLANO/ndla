/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { routes as appRoutes } from "./appRoutes";
import type { NdlaRouteObject } from "./interfaces";

interface FlatRoute {
  path: string;
  private: boolean;
  requiresAuth: boolean;
}

const joinPath = (parent: string, child: string | undefined): string =>
  `/${[parent, child ?? ""].filter(Boolean).join("/")}`.replace(/\/{2,}/g, "/");

export const flattenRoutes = (
  routes: NdlaRouteObject[],
  parent = "",
  inheritedPrivate: boolean = false,
  inheritedRequiresAuth: boolean = false,
): FlatRoute[] =>
  routes.flatMap((route) => {
    if (route.path === "*") return [];
    const path = route.index ? parent : joinPath(parent, route.path);
    const requiresAuth = route.requiresAuth ?? inheritedRequiresAuth;
    const isPrivate = (route.private ?? inheritedPrivate) || requiresAuth;
    return route.children?.length
      ? flattenRoutes(route.children, path, isPrivate, requiresAuth)
      : [{ path, private: isPrivate, requiresAuth }];
  });

const flatRoutes = flattenRoutes(appRoutes);

export const flattenedRoutes = flatRoutes.map((route) => route.path);

export const privateRoutes = flatRoutes.filter((route) => route.private).map((route) => route.path);

export const authenticatedRoutes = flatRoutes.filter((route) => route.requiresAuth).map((route) => route.path);

export const embedRoutes = [
  "article-iframe/article/:articleId",
  "article-iframe/:lang/article/:articleId",
  "article-iframe/:nodeId/:articleId",
  "article-iframe/:lang/:nodeId/:articleId",
  "embed-iframe/video/:videoId",
  "embed-iframe/audio/:audioId",
  "embed-iframe/image/:imageId",
  "embed-iframe/concept/:conceptId",
  "embed-iframe/h5p/:h5pId",
  "embed-iframe/:lang/video/:videoId",
  "embed-iframe/:lang/audio/:audioId",
  "embed-iframe/:lang/image/:imageId",
  "embed-iframe/:lang/concept/:conceptId",
  "embed-iframe/:lang/h5p/:h5pId",
];

export const oembedRoutes = [
  "subject:subjectId/topic:topicId",
  "subject:subjectId/topic:topicId/resource:resourceId",
  "subject:subjectId/topic:topic1/topic:topicId",
  "subject:subjectId/topic:topic1/topic:topicId/resource:resourceId",
  "subject:subjectId/topic:topic1/topic:topic2/topic:topicId",
  "subject:subjectId/topic:topic1/topic:topic2/topic:topicId/resource:resourceId",
  "subject:subjectId/topic:topic1/topic:topic2/topic:topic3/topic:topicId",
  "subject:subjectId/topic:topic1/topic:topic2/topic:topic3/topic:topicId/resource:resourceId",
  "subject:subjectId/topic:topic1/topic:topic2/topic:topic3/topic:topic4/topic:topicId",
  "subject:subjectId/topic:topic1/topic:topic2/topic:topic3/topic:topic4/topic:topicId/resource:resourceId",
  "e/:contextId",
  "e/:root/:name/:contextId",
  "r/:contextId",
  "r/:root/:name/:contextId",
  "article/:articleId",
  "video/:videoId",
  "image/:imageId",
  "concept/:conceptId",
  "audio/:audioId",
  "h5p/:h5pId",
  ...embedRoutes,
];
