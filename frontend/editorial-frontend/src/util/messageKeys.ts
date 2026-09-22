/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LeafKeys, StripSuffix } from "@ndla/locales";
import type { CustomTypeOptions } from "i18next";

/** To avoid widening types to `string` when lowercasing */
export const lowerCased = <T extends string>(value: T): Lowercase<T> => value.toLowerCase() as Lowercase<T>;

type EditorialMessages = CustomTypeOptions["resources"]["translation"];

export type ArticleTypeKey = LeafKeys<EditorialMessages["articleType"]>;
export type StatusActionKey = LeafKeys<EditorialMessages["form"]["status"]["actions"]>;
export type DiffFieldKey = keyof EditorialMessages["diff"]["fields"];

export type FormKey = LeafKeys<EditorialMessages["form"]>;
export type TableActionKey = LeafKeys<EditorialMessages["form"]["content"]["table"]>;

export type SearchFormTypeKey = LeafKeys<EditorialMessages["searchForm"]["types"]>;
export type SearchNoHitsPrefix = StripSuffix<
  Extract<keyof EditorialMessages["searchPage"], `${string}NoHits`>,
  "NoHits"
>;

export type SubjectpageFormKey = LeafKeys<EditorialMessages["subjectpageForm"]>;
export type SubNavigationListTitleKey = LeafKeys<EditorialMessages["subNavigation"]["listTitle"]>;
export type BlockPickerActionKey = LeafKeys<EditorialMessages["editorBlockpicker"]["actions"]>;
