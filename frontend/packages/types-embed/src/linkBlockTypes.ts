/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MetaData } from "./baseTypes";
import type { LinkBlockEmbedAttributes } from "./embedAttributes";

export type LinkBlockEmbedData = LinkBlockEmbedAttributes;

export type LinkBlockMetaData = MetaData<LinkBlockEmbedData, null>;
