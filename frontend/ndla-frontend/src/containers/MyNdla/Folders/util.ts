/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { sortBy } from "@ndla/util";
import config from "../../../config";
import type { GQLMyNdlaResourceFragment } from "../../../graphqlTypes";

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
export const SORT_CONTENT_TYPE = "content-type";

export const sortAndFilterResources = (
  params: URLSearchParams,
  keyedData: Record<string, any>,
  resources: GQLMyNdlaResourceFragment[],
) => {
  let _resources = resources;
  const tagFilters = params.get("tags")?.split(",") ?? [];
  if (tagFilters.length) {
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
