/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CopyrightDTO } from "@ndla/types-backend/article-api";
import type { MetaData } from "./baseTypes";
import type { CopyrightEmbedAttributes } from "./generated/embedAttributes";

export interface CopyrightEmbedData extends Omit<CopyrightEmbedAttributes, "copyright"> {
  copyright: CopyrightDTO;
}

export type CopyrightMetaData = MetaData<CopyrightEmbedData, undefined>;
