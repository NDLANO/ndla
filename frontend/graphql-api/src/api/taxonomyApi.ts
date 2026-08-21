/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type Node,
  type NodeChild,
  type Version,
  type SearchResult,
  type ResourceType,
  type NodeType,
  type NodeConnectionType,
  getAllNodes,
  getAllResourceTypes,
  getAllVersions,
  getChildren,
  getNode,
  getResources,
  searchNodes1,
} from "@ndla/types-backend/taxonomy-api";
import { createClient } from "@ndla/types-backend/taxonomy-api/client";
import { apiUrl } from "../config";
import { apiClientConfig, resolveJsonOATS } from "../utils/api-client/utils";
import { withCustomContext } from "../utils/context/contextStore";

const client = createClient(apiClientConfig({ baseUrl: `${apiUrl}/taxonomy`, useTaxonomyCache: true }));

export async function fetchResourceTypes(context: Context): Promise<ResourceType[]> {
  return getAllResourceTypes({ client, query: { language: context.language } }).then(resolveJsonOATS);
}

export async function fetchSubjectTopics(subjectId: string, context: Context): Promise<Node[]> {
  return getChildren({
    client,
    path: { id: subjectId },
    query: {
      recursive: true,
      nodeType: ["TOPIC"],
      language: context.language,
    },
  }).then(resolveJsonOATS);
}

export async function fetchNode(
  params: { id: string; rootId?: string; parentId?: string },
  context: Context,
): Promise<Node> {
  const { id, rootId, parentId } = params;

  return getNode({
    client,
    path: { id },
    query: {
      language: context.language,
      isVisible: true,
      rootId,
      parentId,
    },
  }).then(resolveJsonOATS);
}

export async function searchNodes(params: { contentUris: string[] }, context: Context): Promise<SearchResult> {
  return searchNodes1({
    client,
    body: {
      language: context.language,
      contentUris: params.contentUris,
      // TODO: This doesn't exist?
      // isVisible: true,
      page: 1,
      pageSize: 100,
    },
  }).then(resolveJsonOATS);
}

export async function fetchChildren(
  params: {
    id: string;
    nodeType?: string;
    recursive?: boolean;
    connectionTypes?: string;
  },
  context: Context,
): Promise<NodeChild[]> {
  return getChildren({
    client,
    path: { id: params.id },
    query: {
      nodeType: params.nodeType ? [params.nodeType as NodeType] : undefined,
      recursive: params.recursive,
      connectionTypes: params.connectionTypes ? [params.connectionTypes as NodeConnectionType] : undefined,
      isVisible: true,
      language: context.language,
    },
  }).then(resolveJsonOATS);
}

interface FetchNodeResourcesParams {
  id: string;
  relevance?: string;
}
export async function fetchNodeResources(params: FetchNodeResourcesParams, context: Context): Promise<NodeChild[]> {
  return getResources({
    client,
    path: { id: params.id },
    query: {
      language: context.language,
      relevance: params.relevance,
      isVisible: true,
    },
  }).then(resolveJsonOATS);
}

export async function fetchVersion(hash: string, context: ContextWithLoaders): Promise<Version | undefined> {
  const result = await withCustomContext({ ...context, versionHash: "default" }, () =>
    getAllVersions({
      client,
      query: {
        hash,
      },
    }),
  );
  if (result.response?.status === 404) {
    return {
      id: "",
      versionType: "BETA",
      name: "Draft",
      hash: "default",
      locked: false,
      created: "",
    };
  }

  const json = await resolveJsonOATS(result);
  return json?.[0];
}

interface NodeQueryParamsBase {
  language?: string;
  isRoot?: boolean;
  isContext?: boolean;
  key?: string;
  value?: string;
  ids?: string[];
  rootId?: string;
  parentId?: string;
  isVisible?: boolean;
  includeContexts?: boolean;
  filterProgrammes?: boolean;
}

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>> }[Keys];

export type NodeQueryParams = NodeQueryParamsBase &
  RequireAtLeastOne<{
    contextId?: string;
    contextIds?: string[];
    contentURI?: string;
    nodeType?: string;
  }>;

export const queryNodes = async (params: NodeQueryParams, context: Context): Promise<Node[]> => {
  return getAllNodes({
    client,
    query: {
      language: context.language,
      isRoot: params.isRoot,
      isContext: params.isContext,
      key: params.key,
      value: params.value,
      ids: params.ids,
      rootId: params.rootId,
      parentId: params.parentId,
      isVisible: params.isVisible,
      includeContexts: params.includeContexts,
      filterProgrammes: params.filterProgrammes,
      contextId: params.contextId,
      contextIds: params.contextIds,
      contentURI: params.contentURI,
      nodeType: params.nodeType ? [params.nodeType as NodeType] : undefined,
    },
  }).then(resolveJsonOATS);
};
