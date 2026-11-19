/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AudioMetaInformationDTO } from "@ndla/types-backend/audio-api";
import type { ImageMetaInformationV3DTO } from "@ndla/types-backend/image-api";
import type { MetaData } from "./baseTypes";
import type { AudioEmbedAttributes } from "./embedAttributes";

export interface AudioEmbedData extends AudioEmbedAttributes {
  url: string;
  pageUrl?: string;
}

export interface AudioMeta extends AudioMetaInformationDTO {
  imageMeta?: ImageMetaInformationV3DTO;
}

export type AudioMetaData = MetaData<AudioEmbedData, AudioMeta>;
