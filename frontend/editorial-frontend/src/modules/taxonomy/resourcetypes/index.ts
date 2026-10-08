/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS, resolveOATS, resolveResponse } from "@ndla/api-client";
import {
  createResourceResourceType as sdkCreateResourceResourceType,
  deleteResourceResourceType as sdkDeleteResourceResourceType,
  getAllResourceTypes,
  getResourceType,
  type ResourceType,
} from "@ndla/types-backend/taxonomy-api";
import { createClient } from "@ndla/types-backend/taxonomy-api/client";
import { FILM_RESOURCE_TYPES } from "../../../constants";
import type { WithTaxonomyVersion } from "../../../interfaces";
import { authClientConfig, resolveLocation } from "../../../util/apiHelpers";
import type { ResourceResourceTypePostBody } from "./resourceTypesApiInterfaces";

const client = createClient(authClientConfig("/taxonomy"));

export interface ResourceTypesGetParams extends WithTaxonomyVersion {
  language: string;
}

export const fetchAllResourceTypes = (params: ResourceTypesGetParams): Promise<ResourceType[]> =>
  getAllResourceTypes({
    client,
    query: params,
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  })
    .then((response) => resolveJsonOATS(response))
    .then((types) =>
      types.map((type) =>
        FILM_RESOURCE_TYPES.includes(type.id) ? { ...type, name: `NDLA Film: ${type.name}` } : type,
      ),
    );

interface ResourceTypeGetParams extends WithTaxonomyVersion {
  id: string;
  language: string;
}

export const fetchResourceType = (params: ResourceTypeGetParams): Promise<ResourceType> =>
  getResourceType({
    client,
    path: { id: params.id },
    query: {
      language: params.language,
    },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

export interface ResourceResourceTypePostParams extends WithTaxonomyVersion {
  body: ResourceResourceTypePostBody;
}

export const createResourceResourceType = (params: ResourceResourceTypePostParams): Promise<string> =>
  // oxlint-disable-next-line typescript/no-deprecated
  sdkCreateResourceResourceType({
    client,
    body: params.body,
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveLocation(resolveResponse(response)));

export interface ResourceResourceTypeDeleteParams extends WithTaxonomyVersion {
  id: string;
}

export const deleteResourceResourceType = (params: ResourceResourceTypeDeleteParams): Promise<void> =>
  // oxlint-disable-next-line typescript/no-deprecated
  sdkDeleteResourceResourceType({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveOATS(response));
