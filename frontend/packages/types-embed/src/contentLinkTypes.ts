/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MetaData } from "./baseTypes";
import type { ContentLinkEmbedAttributes } from "./generated/embedAttributes";

export type ContentLinkEmbedData = ContentLinkEmbedAttributes;

export interface ContentLinkData {
  path: string;
}

export type ContentLinkMetaData = MetaData<ContentLinkEmbedData, ContentLinkData>;
