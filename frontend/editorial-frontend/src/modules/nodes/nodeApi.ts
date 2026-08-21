/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type Node,
  type NodePostPut,
  type NodeChild,
  type NodeConnectionPUT,
  type NodeConnectionPOST,
  type NodeType,
  type Connection,
  type Metadata,
  type MetadataPUT,
  type NodeSearchBody,
  type SearchResult,
  cloneResource,
  createNode,
  createNodeConnection,
  deleteEntity1,
  deleteEntity2,
  getAllConnections,
  getAllNodes,
  getChildren,
  getNode,
  getResources,
  makeResourcesPrimary,
  putMetadata,
  searchNodes as searchNodesSdk,
  searchNodes1,
  updateNode,
  updateNodeConnection,
} from "@ndla/types-backend/taxonomy-api";
import { createClient } from "@ndla/types-backend/taxonomy-api/client";
import type { WithTaxonomyVersion } from "../../interfaces";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveLocation, resolveJsonOATS, resolveOATS } from "../../util/resolveJsonOrRejectWithError";
import type { GetChildNodesParams, GetNodesParams, GetNodeResourcesParams } from "./nodeApiTypes";

const client = createClient(apiClientConfig("/taxonomy"));

interface NodeGetParams extends WithTaxonomyVersion {
  id: string;
  language?: string;
}

export const fetchNode = (params: NodeGetParams): Promise<Node> =>
  getNode({
    client,
    path: { id: params.id },
    query: {
      language: params.language,
    },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

interface NodesGetParams extends WithTaxonomyVersion, GetNodesParams {}

export const fetchNodes = (params: NodesGetParams): Promise<Node[]> =>
  getAllNodes({
    client,
    query: params,
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

interface NodePostParams extends WithTaxonomyVersion {
  body: NodePostPut;
}

export const postNode = (params: NodePostParams): Promise<string> =>
  createNode({
    client,
    body: params.body,
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveLocation(response.response));

interface ConnectionsForNodeGetParams extends WithTaxonomyVersion {
  id: string;
}

export const fetchConnectionsForNode = (params: ConnectionsForNodeGetParams): Promise<Connection[]> =>
  getAllConnections({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

interface NodeDeleteParams extends WithTaxonomyVersion {
  id: string;
}

export const deleteNode = (params: NodeDeleteParams): Promise<void> =>
  deleteEntity1({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveOATS(response));

interface NodeMetadataPutParams extends WithTaxonomyVersion {
  id: string;
  meta: MetadataPUT;
}

export const putNodeMetadata = (params: NodeMetadataPutParams): Promise<Metadata> =>
  putMetadata({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
    body: params.meta,
  }).then((response) => resolveJsonOATS(response));

interface ChildNodesGetParams extends WithTaxonomyVersion, GetChildNodesParams {
  id: string;
}

export const fetchChildNodes = (params: ChildNodesGetParams): Promise<NodeChild[]> =>
  getChildren({
    client,
    path: { id: params.id },
    query: {
      recursive: params.recursive,
      nodeType: params.nodeType,
      language: params.language,
      includeContexts: params.includeContexts,
      filterProgrammes: params.filterProgrammes,
      isVisible: params.isVisible,
      connectionTypes: params.connectionTypes,
    },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

interface NodeResourcesGetParams extends WithTaxonomyVersion, GetNodeResourcesParams {
  id: string;
}

export const fetchNodeResources = (params: NodeResourcesGetParams): Promise<NodeChild[]> =>
  getResources({
    client,
    path: { id: params.id },
    query: {
      language: params.language,
      recursive: params.recursive,
      relevance: params.relevance,
      includeContexts: params.includeContexts,
      filterProgrammes: params.filterProgrammes,
      isVisible: params.isVisible,
    },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

interface NodeConnectionDeleteParams extends WithTaxonomyVersion {
  id: string;
}

export const deleteNodeConnection = (params: NodeConnectionDeleteParams): Promise<void> =>
  deleteEntity2({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveOATS(response));

interface NodeConnectionPutParams extends WithTaxonomyVersion {
  id: string;
  body: NodeConnectionPUT;
}

export const putNodeConnection = (params: NodeConnectionPutParams): Promise<void> =>
  updateNodeConnection({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
    body: params.body,
  }).then((response) => resolveOATS(response));

interface NodeConnectionPostParams extends WithTaxonomyVersion {
  body: NodeConnectionPOST;
}

export const postNodeConnection = (params: NodeConnectionPostParams): Promise<string> =>
  createNodeConnection({
    client,
    headers: {
      VersionHash: params.taxonomyVersion,
    },
    body: params.body,
  }).then((response) => resolveLocation(response.response));

interface SearchNodes extends WithTaxonomyVersion {
  ids?: string[];
  language?: string;
  nodeType?: NodeType[];
  page?: number;
  pageSize?: number;
  query?: string;
}

export const searchNodes = (params: SearchNodes): Promise<SearchResult> =>
  searchNodesSdk({
    client,
    query: {
      ids: params.ids,
      language: params.language,
      nodeType: params.nodeType,
      page: params.page,
      pageSize: params.pageSize,
      query: params.query,
    },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

interface PostSearchNodes extends WithTaxonomyVersion {
  body: NodeSearchBody;
}

export const postSearchNodes = (params: PostSearchNodes): Promise<SearchResult> =>
  searchNodes1({
    client,
    body: params.body,
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

export interface PutNodeParams extends WithTaxonomyVersion {
  id: string;
  body: NodePostPut;
}

export const putNode = (params: PutNodeParams): Promise<void> =>
  updateNode({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
    body: params.body,
  }).then((response) => resolveOATS(response));

export interface PutResourcesPrimaryParams extends WithTaxonomyVersion {
  id: string;
  recursive: boolean;
}

export const putResourcesPrimary = (params: PutResourcesPrimaryParams): Promise<boolean> =>
  makeResourcesPrimary({
    client,
    path: { id: params.id },
    query: { recursive: params.recursive },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
  }).then((response) => resolveJsonOATS(response));

export interface CloneNodeParams extends WithTaxonomyVersion {
  id: string;
  body: {
    contentUri?: string;
    name: string;
    id?: string;
  };
}

export const cloneNode = (params: CloneNodeParams): Promise<string> =>
  cloneResource({
    client,
    path: { id: params.id },
    headers: {
      VersionHash: params.taxonomyVersion,
    },
    body: params.body,
  }).then((response) => resolveLocation(response.response));
