/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LeafKeys, StripSuffix } from "@ndla/locales";
import type { CustomTypeOptions } from "i18next";

/**
 * `toLowerCase()` widens a literal union back to `string`, which loses the key. Backend enums are
 * upper case and the message store names them in lower case, so this is the one place that bridges
 * the two instead of an assertion per call site.
 */
export const lowerCased = <T extends string>(value: T): Lowercase<T> => value.toLowerCase() as Lowercase<T>;

/** The merged key space, as declared for i18next in `types/i18next.d.ts`. */
type EditorialMessages = CustomTypeOptions["resources"]["translation"];

// Types for values that are ours to choose but flow through props or local constants. Anything
// that genuinely originates in a backend payload uses `tDynamic` instead.
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
