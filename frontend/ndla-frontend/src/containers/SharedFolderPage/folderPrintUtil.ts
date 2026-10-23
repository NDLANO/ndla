/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { uniqBy } from "@ndla/util";
import type { GQLMyNdlaResourceFragment } from "../../graphqlTypes";
import { keyId } from "../MyNdla/Folders/util";

export interface FolderWithResources {
  resources: GQLMyNdlaResourceFragment[];
  subfolders?: FolderWithResources[];
}

const collectResources = (folder: FolderWithResources): GQLMyNdlaResourceFragment[] => [
  ...folder.resources,
  ...(folder.subfolders ?? []).flatMap(collectResources),
];

// Includes resources in all subfolders. The same content can be saved several times, in different folders or with
// different paths, so we only keep the first occurrence.
export const getAllResources = (folder: FolderWithResources) =>
  uniqBy(collectResources(folder), (resource) => keyId(resource.resourceType, resource.resourceId));
