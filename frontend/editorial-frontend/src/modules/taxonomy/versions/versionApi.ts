/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS, resolveOATS, resolveResponse } from "@ndla/api-client";
import {
  createVersion,
  deleteEntity,
  getAllVersions,
  getVersion,
  publishVersion as sdkPublishVersion,
  updateVersion,
  type Version,
  type VersionPost,
  type VersionPut,
  type VersionType,
} from "@ndla/types-backend/taxonomy-api";
import { createClient } from "@ndla/types-backend/taxonomy-api/client";
import { authClientConfig, resolveLocation } from "../../../util/apiHelpers";

const client = createClient(authClientConfig("/taxonomy"));

export interface VersionGetParams {
  type?: VersionType;
  hash?: string;
}

export const fetchVersions = (params: VersionGetParams): Promise<Version[]> =>
  getAllVersions({ client, query: params }).then((response) => resolveJsonOATS(response));

export interface VersionGetParam {
  id: string;
}

export const fetchVersion = (params: VersionGetParam): Promise<Version> =>
  getVersion({ client, path: params }).then((response) => resolveJsonOATS(response));

interface VersionPostParams {
  body: VersionPost;
  sourceId?: string;
}

export const postVersion = (params: VersionPostParams): Promise<string> =>
  createVersion({ client, query: { sourceId: params.sourceId }, body: params.body }).then((response) =>
    resolveLocation(resolveResponse(response)),
  );

interface VersionPutParams {
  id: string;
  body: VersionPut;
}

export const putVersion = (params: VersionPutParams): Promise<void> =>
  updateVersion({ client, path: { id: params.id }, body: params.body }).then((response) => resolveOATS(response));

interface VersionDeleteParams {
  id: string;
}

export const deleteVersion = (params: VersionDeleteParams): Promise<void> =>
  deleteEntity({ client, path: { id: params.id } }).then((response) => resolveOATS(response));

interface PublishVersionParams {
  id: string;
}

export const publishVersion = (params: PublishVersionParams): Promise<void> =>
  sdkPublishVersion({ client, path: { id: params.id } }).then((response) => resolveOATS(response));
