/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CopyrightDTO, ImageMetaInformationV3DTO } from "@ndla/types-backend/image-api";
import type { MetaData } from "./baseTypes";
import type { ImageEmbedAttributes } from "./embedAttributes";

export interface ImageEmbedData extends Omit<ImageEmbedAttributes, "caption"> {
  caption?: string;
  url?: string;
  metaData?: any;
  pageUrl?: string;
}

export interface ImageData {
  title: string;
  altText: string;
  copyright: CopyrightDTO;
  src: string;
  copyText: string;
}

export type ImageMetaData = MetaData<ImageEmbedData, ImageMetaInformationV3DTO>;
