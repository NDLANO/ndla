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

type EditorialTranslations = CustomTypeOptions["resources"]["translation"];

export type ArticleTypeKey = LeafKeys<EditorialTranslations["articleType"]>;
export type StatusActionKey = LeafKeys<EditorialTranslations["form"]["status"]["actions"]>;
export type DiffFieldKey = keyof EditorialTranslations["diff"]["fields"];

export type FormKey = LeafKeys<EditorialTranslations["form"]>;
export type TableActionKey = LeafKeys<EditorialTranslations["form"]["content"]["table"]>;

export type SearchFormTypeKey = LeafKeys<EditorialTranslations["searchForm"]["types"]>;
export type SearchNoHitsPrefix = StripSuffix<
  Extract<keyof EditorialTranslations["searchPage"], `${string}NoHits`>,
  "NoHits"
>;

export type SubjectpageFormKey = LeafKeys<EditorialTranslations["subjectpageForm"]>;
export type SubNavigationListTitleKey = LeafKeys<EditorialTranslations["subNavigation"]["listTitle"]>;
export type BlockPickerActionKey = LeafKeys<EditorialTranslations["editorBlockpicker"]["actions"]>;
