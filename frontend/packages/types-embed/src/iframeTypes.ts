/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ImageMetaInformationV3DTO } from "@ndla/types-backend/image-api";
import type { MetaData } from "./baseTypes";
import type { IframeEmbedAttributes } from "./generated/embedAttributes";

export type IframeEmbedData = IframeEmbedAttributes;

export interface IframeData {
  iframeImage?: ImageMetaInformationV3DTO;
}

export type IframeMetaData = MetaData<IframeEmbedData, IframeData>;
