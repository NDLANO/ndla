/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MetaData } from "./baseTypes";
import type { FootnoteEmbedAttributes } from "./generated/embedAttributes";

export type FootnoteEmbedData = FootnoteEmbedAttributes;

export interface FootnoteData {
  entryNum: number;
  authors: string[];
  year: string;
}

export type FootnoteMetaData = MetaData<FootnoteEmbedData, FootnoteData>;
