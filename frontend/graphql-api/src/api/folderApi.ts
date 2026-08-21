/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type MyNDLAUserDTO,
  type FolderDTO,
  type FolderDataDTO,
  type ResourceDTO,
  type UserFolderDTO,
  type ResourceType,
  type FolderStatus,
  type ResourceConnectionDTO,
  deleteMyndlaApiV1FoldersFolderId,
  deleteMyndlaApiV1FoldersFolderIdResourcesBatch,
  deleteMyndlaApiV1FoldersFolderIdResourcesResourceId,
  deleteMyndlaApiV1FoldersResourcesRootBatch,
  deleteMyndlaApiV1FoldersResourcesRootResourceId,
  deleteMyndlaApiV1FoldersSharedFolderIdSave,
  deleteMyndlaApiV1UsersDeletePersonalData,
  getMyndlaApiV1Folders,
  getMyndlaApiV1FoldersFolderId,
  getMyndlaApiV1FoldersResources,
  getMyndlaApiV1FoldersResourcesConnections,
  getMyndlaApiV1FoldersResourcesPath,
  getMyndlaApiV1FoldersResourcesRecent,
  getMyndlaApiV1FoldersResourcesRoot,
  getMyndlaApiV1FoldersResourcesTags,
  getMyndlaApiV1FoldersSharedFolderId,
  getMyndlaApiV1Users,
  patchMyndlaApiV1FoldersFolderId,
  patchMyndlaApiV1FoldersResourcesResourceId,
  patchMyndlaApiV1FoldersSharedFolderId,
  patchMyndlaApiV1Users,
  postMyndlaApiV1Folders,
  postMyndlaApiV1FoldersCloneSourceFolderId,
  postMyndlaApiV1FoldersFolderIdResources,
  postMyndlaApiV1FoldersResourcesRoot,
  postMyndlaApiV1FoldersSharedFolderIdSave,
  putMyndlaApiV1FoldersResourcesCopyBatch,
  putMyndlaApiV1FoldersResourcesMove,
  putMyndlaApiV1FoldersResourcesMoveBatch,
  putMyndlaApiV1FoldersSortResourcesFolderId,
  putMyndlaApiV1FoldersSortResourcesRoot,
  putMyndlaApiV1FoldersSortSaved,
  putMyndlaApiV1FoldersSortSubfolders,
} from "@ndla/types-backend/myndla-api";
import { createClient } from "@ndla/types-backend/myndla-api/client";
import type {
  GQLMutationAddFolderArgs,
  GQLMutationAddMyNdlaResourceArgs,
  GQLMutationCopyMyNdlaResourcesArgs,
  GQLMutationCopySharedFolderArgs,
  GQLMutationDeleteFolderArgs,
  GQLMutationDeleteMyNdlaResourceArgs,
  GQLMutationDeleteMyNdlaResourcesArgs,
  GQLMutationFavoriteSharedFolderArgs,
  GQLMutationMoveFolderArgs,
  GQLMutationMoveMyNdlaResourceArgs,
  GQLMutationMoveMyNdlaResourcesArgs,
  GQLMutationSortFoldersArgs,
  GQLMutationSortResourcesArgs,
  GQLMutationSortSavedSharedFoldersArgs,
  GQLMutationUnFavoriteSharedFolderArgs,
  GQLMutationUpdateFolderArgs,
  GQLMutationUpdateFolderStatusArgs,
  GQLMutationUpdateMyNdlaResourceArgs,
  GQLMutationUpdatePersonalDataArgs,
  GQLQueryAllMyNdlaResourcesArgs,
  GQLQueryFolderArgs,
  GQLQueryFoldersArgs,
  GQLQueryMyNdlaResourceArgs,
  GQLQueryMyNdlaResourceConnectionsArgs,
  GQLQueryRecentlyFavoritedResourcesArgs,
  GQLSortResult,
} from "../types/schema";
import { apiClientConfig, resolveJsonOATS, resolveOATS } from "../utils/api-client/utils";

const client = createClient(apiClientConfig({ disableCache: true }));

export async function fetchFolders(
  { includeResources, includeSubfolders }: GQLQueryFoldersArgs,
  _context: Context,
): Promise<UserFolderDTO> {
  return getMyndlaApiV1Folders({
    client,
    query: {
      "include-resources": includeResources,
      "include-subfolders": includeSubfolders,
    },
  }).then(resolveJsonOATS);
}

export async function fetchFolder(
  { id, includeResources, includeSubfolders }: GQLQueryFolderArgs,
  _context: Context,
): Promise<FolderDataDTO> {
  return getMyndlaApiV1FoldersFolderId({
    client,
    path: {
      "folder-id": id,
    },
    query: {
      "include-resources": includeResources,
      "include-subfolders": includeSubfolders,
    },
  }).then(resolveJsonOATS);
}

export async function fetchSharedFolder({ id }: GQLQueryFolderArgs, _context: Context): Promise<FolderDataDTO> {
  return getMyndlaApiV1FoldersSharedFolderId({ client, path: { "folder-id": id } }).then(resolveJsonOATS);
}

export async function fetchRecentlyFavoritedResources(
  { size }: GQLQueryRecentlyFavoritedResourcesArgs,
  _context: Context,
): Promise<ResourceDTO[]> {
  return getMyndlaApiV1FoldersResourcesRecent({ client, query: { size } }).then(resolveJsonOATS);
}

export async function fetchAllMyNdlaResources(
  { size }: GQLQueryAllMyNdlaResourcesArgs,
  _context: Context,
): Promise<ResourceDTO[]> {
  return getMyndlaApiV1FoldersResources({ client, query: { size } }).then(resolveJsonOATS);
}

export async function fetchMyNdlaRootResources(_context: Context): Promise<ResourceDTO[]> {
  return getMyndlaApiV1FoldersResourcesRoot({ client }).then(resolveJsonOATS);
}

export async function fetchMyNdlaResource(
  { path }: GQLQueryMyNdlaResourceArgs,
  _context: Context,
): Promise<ResourceDTO> {
  return getMyndlaApiV1FoldersResourcesPath({ client, query: { path } }).then(resolveJsonOATS);
}

export async function getMyNdlaResourceConnections(
  { path }: GQLQueryMyNdlaResourceConnectionsArgs,
  _context: Context,
): Promise<ResourceConnectionDTO[]> {
  return getMyndlaApiV1FoldersResourcesConnections({ client, query: { path } }).then(resolveJsonOATS);
}

export async function postFolder(
  { name, parentId, status, description }: GQLMutationAddFolderArgs,
  _context: Context,
): Promise<FolderDTO> {
  const body = {
    name,
    parentId,
    status,
    description,
  };

  return postMyndlaApiV1Folders({ client, body }).then(resolveJsonOATS);
}

export async function moveFolder({ id, parentId }: GQLMutationMoveFolderArgs, _context: Context): Promise<FolderDTO> {
  return patchMyndlaApiV1FoldersFolderId({
    client,
    path: { "folder-id": id },
    body: { parentId },
  }).then(resolveJsonOATS);
}

export async function patchFolder(
  { id, name, status, description }: GQLMutationUpdateFolderArgs,
  _context: Context,
): Promise<FolderDTO> {
  return patchMyndlaApiV1FoldersFolderId({
    client,
    path: { "folder-id": id },
    body: { name, status, description },
  }).then(resolveJsonOATS);
}

export async function deleteFolder({ id }: GQLMutationDeleteFolderArgs, _context: Context): Promise<string> {
  await deleteMyndlaApiV1FoldersFolderId({ client, path: { "folder-id": id } }).then(resolveOATS);
  return id;
}

export async function postMyNdlaResource(
  { folderId, resourceType, path, tags, resourceId }: GQLMutationAddMyNdlaResourceArgs,
  _context: Context,
): Promise<ResourceDTO> {
  if (folderId) {
    return postMyndlaApiV1FoldersFolderIdResources({
      client,
      path: { "folder-id": folderId },
      body: {
        resourceType: resourceType as ResourceType,
        path,
        tags,
        resourceId,
      },
    }).then(resolveJsonOATS);
  } else {
    return postMyndlaApiV1FoldersResourcesRoot({
      client,
      body: {
        resourceType: resourceType as ResourceType,
        path,
        tags,
        resourceId,
      },
    }).then(resolveJsonOATS);
  }
}

export async function patchMyNdlaResource(
  { id, tags }: GQLMutationUpdateMyNdlaResourceArgs,
  _context: Context,
): Promise<ResourceDTO> {
  return patchMyndlaApiV1FoldersResourcesResourceId({
    client,
    path: { "resource-id": id },
    body: { tags },
  }).then(resolveJsonOATS);
}

export async function moveMyNdlaResource(
  { id, fromFolderId, toFolderId }: GQLMutationMoveMyNdlaResourceArgs,
  _context: Context,
): Promise<boolean> {
  if (fromFolderId === undefined || toFolderId === undefined) {
    throw new Error("Both fromFolderId and toFolderId must be provided to move a resource");
  }
  const res = await putMyndlaApiV1FoldersResourcesMove({
    client,
    body: {
      fromFolderId,
      toFolderId,
      resourceId: id,
    },
  });

  return res.response?.status === 204;
}

export async function deleteMyNdlaResource(
  { folderId, resourceId }: GQLMutationDeleteMyNdlaResourceArgs,
  _context: Context,
): Promise<string> {
  if (folderId) {
    await deleteMyndlaApiV1FoldersFolderIdResourcesResourceId({
      client,
      path: {
        "folder-id": folderId,
        "resource-id": resourceId,
      },
    }).then(resolveOATS);
  } else {
    await deleteMyndlaApiV1FoldersResourcesRootResourceId({
      client,
      path: { "resource-id": resourceId },
    }).then(resolveOATS);
  }
  return resourceId;
}

export async function deletePersonalData(_context: Context): Promise<boolean> {
  try {
    await deleteMyndlaApiV1UsersDeletePersonalData({ client });
    return true;
  } catch (e) {
    return false;
  }
}

export async function getPersonalData(_context: Context): Promise<MyNDLAUserDTO | undefined> {
  try {
    return getMyndlaApiV1Users({ client }).then(resolveJsonOATS);
  } catch (e) {
    return undefined;
  }
}

export async function patchPersonalData(
  userData: GQLMutationUpdatePersonalDataArgs,
  _context: Context,
): Promise<MyNDLAUserDTO> {
  return patchMyndlaApiV1Users({ client, body: userData }).then(resolveJsonOATS);
}

export async function sortFolders(
  { parentId, sortedIds }: GQLMutationSortFoldersArgs,
  _context: Context,
): Promise<GQLSortResult> {
  await putMyndlaApiV1FoldersSortSubfolders({
    client,
    query: {
      "folder-id": parentId,
    },
    body: { sortedIds },
  }).then(resolveOATS);

  return { parentId, sortedIds };
}

export async function sortResources(
  { parentId, sortedIds }: GQLMutationSortResourcesArgs,
  _context: Context,
): Promise<GQLSortResult> {
  if (parentId) {
    await putMyndlaApiV1FoldersSortResourcesFolderId({
      client,
      path: { "folder-id": parentId },
      body: { sortedIds },
    }).then(resolveOATS);
  } else {
    await putMyndlaApiV1FoldersSortResourcesRoot({ client, body: { sortedIds } }).then(resolveOATS);
  }
  return { parentId, sortedIds };
}

export async function sortSavedSharedFolders(
  { sortedIds }: GQLMutationSortSavedSharedFoldersArgs,
  _context: Context,
): Promise<GQLSortResult> {
  await putMyndlaApiV1FoldersSortSaved({ client, body: { sortedIds } }).then(resolveOATS);

  return { sortedIds };
}

export async function updateFolderStatus(
  { folderId, status }: GQLMutationUpdateFolderStatusArgs,
  _context: Context,
): Promise<string[]> {
  return patchMyndlaApiV1FoldersSharedFolderId({
    client,
    path: {
      "folder-id": folderId,
    },
    query: {
      "folder-status": status as FolderStatus,
    },
  }).then(resolveJsonOATS);
}

export async function copySharedFolder(
  { folderId, destinationFolderId }: GQLMutationCopySharedFolderArgs,
  _context: Context,
) {
  return postMyndlaApiV1FoldersCloneSourceFolderId({
    client,
    path: {
      "source-folder-id": folderId,
    },
    query: {
      "destination-folder-id": destinationFolderId,
    },
  }).then(resolveJsonOATS);
}

export async function favoriteSharedFolder(
  { folderId }: GQLMutationFavoriteSharedFolderArgs,
  _context: Context,
): Promise<string> {
  await postMyndlaApiV1FoldersSharedFolderIdSave({
    client,
    path: {
      "folder-id": folderId,
    },
  }).then(resolveOATS);

  return folderId;
}

export async function unFavoriteSharedFolder(
  { folderId }: GQLMutationUnFavoriteSharedFolderArgs,
  _context: Context,
): Promise<string> {
  await deleteMyndlaApiV1FoldersSharedFolderIdSave({
    client,
    path: { "folder-id": folderId },
  }).then(resolveOATS);
  return folderId;
}

export async function getResourceTags(_context: Context): Promise<string[]> {
  return await getMyndlaApiV1FoldersResourcesTags({ client }).then(resolveJsonOATS);
}

export async function moveMyNdlaResources(
  { fromFolderId, toFolderId, resourceIds }: GQLMutationMoveMyNdlaResourcesArgs,
  _context: Context,
): Promise<boolean> {
  if (fromFolderId === undefined || toFolderId === undefined) {
    throw new Error("fromFolderId and toFolderId must be provided to move resources");
  }
  const res = await putMyndlaApiV1FoldersResourcesMoveBatch({
    client,
    body: {
      fromFolderId,
      toFolderId,
      resourceIds,
    },
  });

  return res.response?.status === 204;
}

export async function copyMyNdlaResources(
  { toFolderId, resourceIds }: GQLMutationCopyMyNdlaResourcesArgs,
  _context: Context,
): Promise<boolean> {
  if (toFolderId === undefined) {
    throw new Error("toFolderId must be null or a folder UUID");
  }

  const res = await putMyndlaApiV1FoldersResourcesCopyBatch({
    client,
    body: {
      toFolderId,
      resourceIds,
    },
  });

  return res.response?.status === 204;
}

async function deleteRootResources(resourceIds: string[]): Promise<boolean> {
  const res = await deleteMyndlaApiV1FoldersResourcesRootBatch({ client, body: resourceIds });

  return res.response?.status === 204;
}

async function deleteFolderResources(folderId: string, resourceIds: string[]): Promise<boolean> {
  const res = await deleteMyndlaApiV1FoldersFolderIdResourcesBatch({
    client,
    path: { "folder-id": folderId },
    body: resourceIds,
  });

  return res.response?.status === 204;
}

export async function deleteMyNdlaResources(
  { folderId, resourceIds }: GQLMutationDeleteMyNdlaResourcesArgs,
  _context: Context,
): Promise<boolean> {
  if (folderId === undefined) {
    throw new Error("folderId must be either null or a folder UUID");
  } else if (folderId === null) {
    return await deleteRootResources(resourceIds);
  } else return await deleteFolderResources(folderId, resourceIds);
}
