/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ImageMetaInformationV3DTO } from "@ndla/types-backend/image-api";
import type { MetaData } from "./baseTypes";
import type { CampaignBlockEmbedAttributes } from "./embedAttributes";

export interface CampaignBlockEmbedData extends CampaignBlockEmbedAttributes {
  background?: "brand1" | "neutral" | "brand3";
}

export interface CampaignBlockMeta {
  image?: ImageMetaInformationV3DTO;
}

export type CampaignBlockMetaData = MetaData<CampaignBlockEmbedData, CampaignBlockMeta>;
