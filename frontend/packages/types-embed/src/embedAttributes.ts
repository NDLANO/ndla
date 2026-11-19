/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { embedTagRules } from "./embedTagRules";

type Rules = typeof embedTagRules;

type CamelCase<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<CamelCase<Tail>>}`
    : S;

type AttributeKey<Name> = Name extends `data-${infer Rest}` ? CamelCase<Rest> : never;

type AttributeValue<Field> = Field extends {
  validation: { dataType: "ENUM"; allowedValues: readonly (infer Value)[] };
}
  ? Value
  : Field extends { validation: { dataType: "BOOLEAN" } }
    ? "true" | "false"
    : string;

type Fields<Resource extends EmbedResource> = Exclude<Rules[Resource]["fields"][number], { name: "data-resource" }>;

type Attributes<Resource extends EmbedResource> = {
  resource: Resource;
} & {
  [
    Field in Fields<Resource> as Field extends { validation: { required: true } } ? AttributeKey<Field["name"]> : never
  ]: AttributeValue<Field>;
} & {
  [
    Field in Fields<Resource> as Field extends { validation: { required: true } } ? never : AttributeKey<Field["name"]>
  ]?: AttributeValue<Field>;
};

type Flatten<T> = { [Key in keyof T]: T[Key] };

export type EmbedResource = keyof Rules;

export type EmbedAttributesByResource = { [Resource in EmbedResource]: Flatten<Attributes<Resource>> };

export type EmbedAttributes = EmbedAttributesByResource[EmbedResource];

export type SymbolEmbedAttributes = EmbedAttributesByResource["symbol"];
export type CopyrightEmbedAttributes = EmbedAttributesByResource["copyright"];
export type UuDisclaimerEmbedAttributes = EmbedAttributesByResource["uu-disclaimer"];
export type CommentEmbedAttributes = EmbedAttributesByResource["comment"];
export type H5pEmbedAttributes = EmbedAttributesByResource["h5p"];
export type ExternalEmbedAttributes = EmbedAttributesByResource["external"];
export type ErrorEmbedAttributes = EmbedAttributesByResource["error"];
export type AudioEmbedAttributes = EmbedAttributesByResource["audio"];
export type NrkEmbedAttributes = EmbedAttributesByResource["nrk"];
export type ContentLinkEmbedAttributes = EmbedAttributesByResource["content-link"];
export type BrightcoveEmbedAttributes = EmbedAttributesByResource["brightcove"];
export type ImageEmbedAttributes = EmbedAttributesByResource["image"];
export type ConceptEmbedAttributes = EmbedAttributesByResource["concept"];
export type IframeEmbedAttributes = EmbedAttributesByResource["iframe"];
export type FootnoteEmbedAttributes = EmbedAttributesByResource["footnote"];
export type CodeBlockEmbedAttributes = EmbedAttributesByResource["code-block"];
export type RelatedContentEmbedAttributes = EmbedAttributesByResource["related-content"];
export type FileEmbedAttributes = EmbedAttributesByResource["file"];
export type ContactBlockEmbedAttributes = EmbedAttributesByResource["contact-block"];
export type PitchEmbedAttributes = EmbedAttributesByResource["pitch"];
export type KeyFigureEmbedAttributes = EmbedAttributesByResource["key-figure"];
export type CampaignBlockEmbedAttributes = EmbedAttributesByResource["campaign-block"];
export type LinkBlockEmbedAttributes = EmbedAttributesByResource["link-block"];
