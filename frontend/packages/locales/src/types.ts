/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type translationsNB from "./translations-nb";

export type Translations = typeof translationsNB;
export type MergeTranslations<Shared, App> = Shared & App;
export type LeafKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
export type StripSuffix<T, S extends string> = T extends `${infer Base}${S}` ? Base : never;
