/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type messagesNB from "./messages-nb";

export type Messages = typeof messagesNB;
export type MergeMessages<Shared, App> = Shared & App;
export type LeafKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
export type StripSuffix<T, S extends string> = T extends `${infer Base}${S}` ? Base : never;
