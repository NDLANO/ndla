/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LeafKeys, StripSuffix } from "@ndla/locales";
import type { CustomTypeOptions } from "i18next";

/** The merged key space, as declared for i18next in `types/i18next.d.ts`. */
type EditorialMessages = CustomTypeOptions["resources"]["translation"];

// Backend contracts type these as open strings; we only ship copy for the members below.
export type LanguageKey = LeafKeys<EditorialMessages["languages"]>;
export type StatusKey = LeafKeys<EditorialMessages["form"]["status"]>;
export type StatusActionKey = LeafKeys<EditorialMessages["form"]["status"]["actions"]>;
export type TaxonomyNodeTypeKey = LeafKeys<EditorialMessages["taxonomy"]["nodeType"]>;
export type ContentTypeKey = LeafKeys<EditorialMessages["contentTypes"]>;
export type DiffFieldKey = keyof EditorialMessages["diff"]["fields"];

/** Groups under `form` that define the given member, e.g. `form.concept.remove`. */
type FormGroupsWith<Member extends string> = {
  [K in keyof EditorialMessages["form"]]: Member extends keyof EditorialMessages["form"][K] ? K : never;
}[keyof EditorialMessages["form"]];

export type FormKey = LeafKeys<EditorialMessages["form"]>;
export type FormNameKey = LeafKeys<EditorialMessages["form"]["name"]>;
export type FormRemoveKey = FormGroupsWith<"remove">;
export type FormEditKey = FormGroupsWith<"edit">;
export type FormContentRemoveKey = {
  [K in keyof EditorialMessages["form"]["content"]]: "remove" extends keyof EditorialMessages["form"]["content"][K]
    ? K
    : never;
}[keyof EditorialMessages["form"]["content"]];
export type TableActionKey = LeafKeys<EditorialMessages["form"]["content"]["table"]>;
export type VisualElementKey = LeafKeys<EditorialMessages["form"]["visualElement"]>;
export type VisualElementPickerKey = LeafKeys<EditorialMessages["form"]["visualElementPicker"]>;
export type LearningpathStatusKey = LeafKeys<EditorialMessages["form"]["status"]["learningpath_statuses"]>;

export type SearchFormKey = LeafKeys<EditorialMessages["searchForm"]>;
export type SearchFormTypeKey = LeafKeys<EditorialMessages["searchForm"]["types"]>;
export type SearchTagTypeKey = LeafKeys<EditorialMessages["searchForm"]["tagType"]>;
export type SearchSaveKey = LeafKeys<EditorialMessages["searchPage"]["save"]>;
export type SearchHighlightKey = LeafKeys<EditorialMessages["searchPage"]["highlights"]>;
export type SearchNoHitsPrefix = StripSuffix<
  Extract<keyof EditorialMessages["searchPage"], `${string}NoHits`>,
  "NoHits"
>;

export type TaxonomyKey = LeafKeys<EditorialMessages["taxonomy"]>;
export type TaxonomySettingsPrefix = StripSuffix<
  Extract<keyof EditorialMessages["taxonomy"], `${string}Settings`>,
  "Settings"
>;

export type ArticleTypeKey = LeafKeys<EditorialMessages["articleType"]>;
export type ArticleTraitKey = LeafKeys<EditorialMessages["articleTraits"]>;
export type WordClassKey = LeafKeys<EditorialMessages["wordClass"]>;
export type SymbolKey = LeafKeys<EditorialMessages["symbols"]>;
export type SubjectTypeKey = LeafKeys<EditorialMessages["subjectTypes"]>;
export type SubjectCategoryKey = LeafKeys<EditorialMessages["subjectCategories"]>;
export type SubjectpageFormKey = LeafKeys<EditorialMessages["subjectpageForm"]>;
export type SubNavigationListTitleKey = LeafKeys<EditorialMessages["subNavigation"]["listTitle"]>;
export type EditorToolbarKey = LeafKeys<EditorialMessages["editorToolbar"]>;
export type BlockPickerActionKey = LeafKeys<EditorialMessages["editorBlockpicker"]["actions"]>;
export type CampaignSideKey = LeafKeys<EditorialMessages["campaignBlockForm"]["sides"]>;
export type ContactBackgroundKey = LeafKeys<EditorialMessages["contactBlockForm"]["background"]>;
export type ImageEditorRemoveKey = LeafKeys<EditorialMessages["imageEditor"]["remove"]>;
export type LearningpathFormTypeKey = LeafKeys<EditorialMessages["learningpathForm"]["steps"]["formTypes"]>;
