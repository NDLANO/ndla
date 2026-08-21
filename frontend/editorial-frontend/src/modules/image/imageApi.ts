/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type ImageMetaInformationV3DTO,
  type UpdateImageMetaInformationDTO,
  type SearchResultV3DTO,
  type TagsSearchResultDTO,
  type SearchParamsDTO,
  type NewImageMetaInformationV2DTO,
  type BulkUploadStartedDTO,
  type ImageEditorsDTO,
  deleteImageApiV3ImagesImageIdLanguageLanguage,
  getImageApiV3ImagesImageId,
  getImageApiV3ImagesTagSearch,
  getImageApiV3ImagesUsersEditors,
  patchImageApiV3ImagesImageId,
  postImageApiV1Bulk,
  postImageApiV3Images,
  postImageApiV3ImagesImageIdCopy,
  postImageApiV3ImagesSearch,
} from "@ndla/types-backend/image-api";
import { createClient } from "@ndla/types-backend/image-api/client";
import { throwErrorPayload, apiClientConfig, fetchAuthorized, apiResourceUrl } from "../../util/apiHelpers";
import { resolveJsonOATS, resolveOATS } from "../../util/resolveJsonOrRejectWithError";

const client = createClient(apiClientConfig());

export const postImage = async (
  metadata: NewImageMetaInformationV2DTO,
  file: Blob,
): Promise<ImageMetaInformationV3DTO> => {
  const res = await postImageApiV3Images({
    client,
    body: {
      metadata,
      file,
    },
  });

  return resolveJsonOATS(res);
};

export const fetchImage = (id: number | string, language?: string): Promise<ImageMetaInformationV3DTO> =>
  getImageApiV3ImagesImageId({
    client,
    path: {
      image_id: typeof id === "string" ? Number(id) : id,
    },
    query: {
      language,
    },
  }).then((r) => resolveJsonOATS(r));

export const updateImage = async (
  id: number,
  metadata: UpdateImageMetaInformationDTO,
  file?: Blob | string,
): Promise<ImageMetaInformationV3DTO> =>
  patchImageApiV3ImagesImageId({
    client,
    path: {
      image_id: id,
    },
    body: {
      metadata,
      file: file instanceof Blob ? file : undefined,
    },
  }).then((r) => resolveJsonOATS(r));

export const postSearchImages = async (body: SearchParamsDTO): Promise<SearchResultV3DTO> =>
  postImageApiV3ImagesSearch({ client, body: body }).then((r) => resolveJsonOATS(r));

export const onError = (err: Response & Error) => {
  throwErrorPayload(err.status, err.message ?? err.statusText, err);
};

export const deleteLanguageVersionImage = async (
  imageId: number,
  locale: string,
): Promise<ImageMetaInformationV3DTO | void> => {
  return deleteImageApiV3ImagesImageIdLanguageLanguage({
    client,
    path: {
      image_id: imageId,
      language: locale,
    },
  }).then((r) => resolveOATS(r));
};

export const fetchSearchTags = async (input: string, language: string): Promise<TagsSearchResultDTO> =>
  getImageApiV3ImagesTagSearch({
    client,
    query: {
      query: input,
      language,
    },
  }).then((r) => resolveJsonOATS(r));

export const cloneImage = async (imageId: number, file: Blob): Promise<ImageMetaInformationV3DTO> =>
  postImageApiV3ImagesImageIdCopy({
    client,
    body: {
      file,
    },
    path: {
      image_id: imageId,
    },
  }).then((r) => resolveJsonOATS(r));

export interface BulkUploadImage {
  metadata: NewImageMetaInformationV2DTO;
  file: Blob;
}

export const bulkUploadImages = async (images: BulkUploadImage[]): Promise<BulkUploadStartedDTO> => {
  const res = await postImageApiV1Bulk({
    client,
    body: {
      metadatas: images.map((image) => image.metadata),
      files: images.map((image) => image.file),
    },
    bodySerializer() {
      const form = new FormData();
      images.forEach(({ metadata, file }) => {
        form.append("metadatas", JSON.stringify(metadata));
        form.append("files", file);
      });
      return form;
    },
  });

  return resolveJsonOATS(res);
};

export const getBulkUploadStatus = async (uploadId: string, signal: AbortSignal) => {
  return await fetchAuthorized(apiResourceUrl(`/image-api/v1/bulk/status/${uploadId}`), {
    signal,
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
};

export const fetchImageEditors = async (): Promise<ImageEditorsDTO> =>
  getImageApiV3ImagesUsersEditors({ client }).then((r) => resolveJsonOATS(r));
