/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MetaData } from "./baseTypes";
import type { CommentEmbedAttributes } from "./embedAttributes";

export type CommentEmbedData = CommentEmbedAttributes;

export type CommentMetaData = MetaData<CommentEmbedData, undefined>;
