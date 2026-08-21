/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ArticleSearchParamsDTO } from "@ndla/types-backend/article-api";
import {
  type LicenseDTO,
  type NewArticleDTO,
  type UpdatedArticleDTO,
  type ArticleDTO,
  type TagsSearchResultDTO,
  type UserDataDTO,
  type ArticleSearchResultDTO,
  type UpdatedUserDataDTO,
  type UploadedFileDTO,
  type ArticleRevisionHistoryDTO,
  deleteDraftApiV1DraftsArticleIdCurrentRevision,
  deleteDraftApiV1DraftsArticleIdLanguageLanguage,
  getDraftApiV1DraftsArticleId,
  getDraftApiV1DraftsArticleIdRevisionHistory,
  getDraftApiV1DraftsExternalIdDeprecatedNodeId,
  getDraftApiV1DraftsIds,
  getDraftApiV1DraftsLicenses,
  getDraftApiV1DraftsSlugSlug,
  getDraftApiV1DraftsStatusStateMachine,
  getDraftApiV1DraftsTagSearch,
  getDraftApiV1UserData,
  getDraftApiV1UserDataEditors,
  getDraftApiV1UserDataResponsibles,
  patchDraftApiV1DraftsArticleId,
  patchDraftApiV1UserData,
  postDraftApiV1Drafts,
  postDraftApiV1DraftsCloneArticleId,
  postDraftApiV1DraftsCopyrevisiondatesNodeId,
  postDraftApiV1DraftsMigrateGreps,
  postDraftApiV1DraftsSearch,
  postDraftApiV1Files,
  putDraftApiV1DraftsArticleIdStatusStatus,
  putDraftApiV1DraftsArticleIdValidate,
} from "@ndla/types-backend/draft-api";
import { createClient } from "@ndla/types-backend/draft-api/client";
import type { DraftStatusType, DraftStatusStateMachineType } from "../../interfaces";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveJsonOATS, resolveOATS } from "../../util/resolveJsonOrRejectWithError";

const client = createClient(apiClientConfig());

export const fetchDraft = async (id: number, language?: string): Promise<ArticleDTO> => {
  return getDraftApiV1DraftsArticleId({ client, path: { article_id: id }, query: { language, fallback: true } }).then(
    (r) => resolveJsonOATS(r),
  );
};

export const fetchBySlug = async (slug: string, language?: string): Promise<ArticleDTO> => {
  return getDraftApiV1DraftsSlugSlug({ client, path: { slug }, query: { language, fallback: true } }).then((r) =>
    resolveJsonOATS(r),
  );
};

export const fetchDrafts = async (ids: number[], language?: string): Promise<ArticleDTO[]> =>
  getDraftApiV1DraftsIds({
    client,
    query: {
      ids,
      language,
      fallback: true,
      page: 1,
      "page-size": ids.length,
    },
  }).then((r) => resolveJsonOATS(r));

export const updateDraft = async (id: number, draft: UpdatedArticleDTO, versionHash = "default"): Promise<ArticleDTO> =>
  patchDraftApiV1DraftsArticleId({
    client,
    path: { article_id: id },
    headers: { VersionHash: versionHash },
    body: draft,
  }).then((r) => resolveJsonOATS(r));

export const createDraft = async (draft: NewArticleDTO): Promise<ArticleDTO> =>
  postDraftApiV1Drafts({ client, body: draft }).then((r) => resolveJsonOATS(r));

export const searchDrafts = async (query: ArticleSearchParamsDTO): Promise<ArticleSearchResultDTO> =>
  postDraftApiV1DraftsSearch({ client, body: query }).then((r) => resolveJsonOATS(r));

export const cloneDraft = async (
  id: number,
  language?: string,
  addCopyPostfixToArticleTitle: boolean = true,
): Promise<ArticleDTO> =>
  postDraftApiV1DraftsCloneArticleId({
    client,
    path: { article_id: id },
    query: {
      language,
      "copied-title-postfix": addCopyPostfixToArticleTitle,
      fallback: true,
    },
  }).then((r) => resolveJsonOATS(r));

export const fetchArticleRevisionHistory = async (id: number, language?: string): Promise<ArticleRevisionHistoryDTO> =>
  getDraftApiV1DraftsArticleIdRevisionHistory({
    client,
    path: { article_id: id },
    query: { language, fallback: true },
  }).then((r) => resolveJsonOATS(r));

export const deleteLanguageVersion = async (id: number, language: string): Promise<ArticleDTO> =>
  deleteDraftApiV1DraftsArticleIdLanguageLanguage({ client, path: { article_id: id, language } }).then((r) =>
    resolveJsonOATS(r),
  );

export const fetchNewArticleId = async (id: number): Promise<{ id: number }> => {
  return getDraftApiV1DraftsExternalIdDeprecatedNodeId({ client, path: { deprecated_node_id: id } }).then((r) =>
    resolveJsonOATS(r),
  );
};

export const validateDraft = async (id: number, draft: UpdatedArticleDTO): Promise<{ id: number }> =>
  putDraftApiV1DraftsArticleIdValidate({ client, body: draft, path: { article_id: id } }).then((r) =>
    resolveJsonOATS(r),
  );

export const updateStatusDraft = async (id: number, status: DraftStatusType): Promise<ArticleDTO> =>
  putDraftApiV1DraftsArticleIdStatusStatus({ client, path: { article_id: id, STATUS: status } }).then((r) =>
    resolveJsonOATS(r),
  );

export const fetchSearchTags = async (input: string, language: string): Promise<TagsSearchResultDTO> =>
  getDraftApiV1DraftsTagSearch({
    client,
    query: {
      language,
      query: input,
    },
  }).then((r) => resolveJsonOATS(r));

export const fetchLicenses = async (): Promise<LicenseDTO[]> =>
  getDraftApiV1DraftsLicenses({ client }).then((r) => resolveJsonOATS(r));

export const fetchUserData = async (): Promise<UserDataDTO> =>
  getDraftApiV1UserData({ client }).then((r) => resolveJsonOATS(r));

export const updateUserData = async (userData: UpdatedUserDataDTO): Promise<UserDataDTO> =>
  patchDraftApiV1UserData({ client, body: userData }).then((r) => resolveJsonOATS(r));

export const fetchDraftEditors = async (): Promise<string[]> =>
  getDraftApiV1UserDataEditors({ client }).then((r) => resolveJsonOATS(r));

export const fetchDraftResponsibles = async (): Promise<string[]> =>
  getDraftApiV1UserDataResponsibles({ client }).then((r) => resolveJsonOATS(r));

export const fetchStatusStateMachine = async (id?: number): Promise<DraftStatusStateMachineType> =>
  getDraftApiV1DraftsStatusStateMachine({ client, query: { articleId: id } }).then((r) => resolveJsonOATS(r));

export const copyRevisionDates = (nodeId: string): Promise<void> =>
  postDraftApiV1DraftsCopyrevisiondatesNodeId({ client, path: { node_id: nodeId } }).then((r) => resolveJsonOATS(r));

export const headFileAtRemote = async (fileUrl: string): Promise<boolean> => {
  const res = await fetch(fileUrl, {
    method: "HEAD",
  });
  return res.status === 200;
};

export const uploadFile = async (file: Blob): Promise<UploadedFileDTO> =>
  postDraftApiV1Files({
    client,
    body: { file },
  }).then((r) => resolveJsonOATS(r));

export const migrateCodes = async (): Promise<void> => {
  await resolveOATS(await postDraftApiV1DraftsMigrateGreps({ client }));
};

export const deleteCurrentRevision = async (articleId: number): Promise<void> =>
  deleteDraftApiV1DraftsArticleIdCurrentRevision({ client, path: { article_id: articleId } }).then((r) =>
    resolveOATS(r),
  );
