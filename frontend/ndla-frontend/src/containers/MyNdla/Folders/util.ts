/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { sortBy } from "@ndla/util";
import config from "../../../config";
import type { GQLMyNdlaResourceFragment, GQLMyNdlaResourceMetaFragment } from "../../../graphqlTypes";

export const sharedFolderLink = (id: string) => `${config.ndlaFrontendDomain}/folder/${id}`;

export const copyFolderSharingLink = (id: string) => window.navigator.clipboard.writeText(sharedFolderLink(id));

export interface withRole {
  role: string;
}

export const isStudent = (user: withRole | null) => user?.role === "student";

export const FOLDERS_HEADING_ID = "folders-section";
export const RESOURCES_HEADING_ID = "resources-section";
export const SHARED_FOLDERS_HEADING_ID = "shared-folders-section";

export const sharedFolderId = (id: string) => `shared-folder-${id}`;
export const folderId = (id: string) => `folder-${id}`;
export const resourceId = (id: string) => `resource-${id}`;

export const keyId = (type: string, id: string) => `${type}-${id}`;

export const SORT_NAME_ASC = "name-asc";
export const SORT_NAME_DESC = "name-desc";
export const SORT_LAST_ADDED = "last-added";
export const SORT_FIRST_ADDED = "first-added";
export const SORT_CONTENT_TYPE = "content-type";

export type ResourceSort =
  | typeof SORT_LAST_ADDED
  | typeof SORT_NAME_ASC
  | typeof SORT_NAME_DESC
  | typeof SORT_CONTENT_TYPE;

export type SharedFolderSort = typeof SORT_LAST_ADDED | typeof SORT_FIRST_ADDED;

const resourceSorts: ResourceSort[] = [SORT_LAST_ADDED, SORT_NAME_ASC, SORT_NAME_DESC, SORT_CONTENT_TYPE];

export const parseResourceSort = (value: string | null): ResourceSort =>
  resourceSorts.find((sort) => sort === value) ?? SORT_LAST_ADDED;

export const parseSharedFolderSort = (value: string | null): SharedFolderSort =>
  value === SORT_FIRST_ADDED ? SORT_FIRST_ADDED : SORT_LAST_ADDED;

export const sortAndFilterResources = (
  params: URLSearchParams,
  keyedData: Record<string, GQLMyNdlaResourceMetaFragment | undefined>,
  resources: GQLMyNdlaResourceFragment[],
) => {
  let _resources = resources;
  const tagFilters = params.get("tags")?.split(",").filter(Boolean) ?? [];
  if (tagFilters.length > 0) {
    _resources = _resources.filter((r) => tagFilters.some((tag) => r.tags.includes(tag)));
  }
  const sortParam = params.get("sort");
  if (sortParam === SORT_NAME_DESC) {
    return sortBy(_resources, (r) => keyedData[keyId(r.resourceType, r.resourceId)]?.title?.toLowerCase()).reverse();
  } else if (sortParam === SORT_NAME_ASC) {
    return sortBy(_resources, (r) => keyedData[keyId(r.resourceType, r.resourceId)]?.title?.toLowerCase());
  } else if (sortParam === SORT_CONTENT_TYPE) {
    return sortBy(_resources, (r) => r.resourceType);
  } else {
    return sortBy(_resources, (r) => r.created).toReversed();
  }
};
