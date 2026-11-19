/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ImageMetaInformationV3DTO } from "@ndla/types-backend/image-api";
import type { MetaData } from "./baseTypes";
import type { ExternalEmbedAttributes } from "./embedAttributes";
import type { OembedProxyResponse } from "./oembedTypes";

export interface OembedEmbedData extends ExternalEmbedAttributes {
  metaData?: any;
  height?: string;
}

export interface OembedData {
  oembed: OembedProxyResponse;
  iframeImage?: ImageMetaInformationV3DTO;
}

export type OembedMetaData = MetaData<OembedEmbedData, OembedData>;
