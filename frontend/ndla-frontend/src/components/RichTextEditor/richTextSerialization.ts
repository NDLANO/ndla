/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  breakSerializer,
  deserializeFromHtml,
  headingSerializer,
  isSectionElement,
  LINK_ELEMENT_TYPE,
  linkSerializer,
  listSerializer,
  markSerializer,
  noopSerializer,
  paragraphSerializer,
  sectionSerializer,
  serializeToHtml,
  SPAN_ELEMENT_TYPE,
  spanSerializer,
  type SlateSerializer,
} from "@ndla/editor";
import type { Descendant } from "slate";

export const serializers: SlateSerializer<any>[] = [
  paragraphSerializer,
  sectionSerializer,
  breakSerializer,
  markSerializer,
  linkSerializer,
  headingSerializer,
  listSerializer,
  spanSerializer,
];

export const deserializeToRichText = (html: string) => {
  const opts = {
    blocks: [],
    inlines: [LINK_ELEMENT_TYPE],
  };
  const res = deserializeFromHtml(html, serializers, opts);
  // TODO: Workaround for plain-text content. If the first block is not a section element, it is not created by our RichTextEditor. It is probably plain text imported from stier.
  return isSectionElement(res[0]) ? res : deserializeFromHtml(`<section>${html}</section>`, serializers, opts);
};

export const serializeFromRichText = (value: Descendant[]) => {
  return serializeToHtml(value, serializers);
};

const simpleSerializers: SlateSerializer<any>[] = [
  noopSerializer,
  paragraphSerializer,
  markSerializer,
  spanSerializer,
  // Line breaks are kept as newlines in the text, which markSerializer serializes back to <br/>
  breakSerializer.configure({ allowedBreakContainers: { value: [], override: true } }),
];

export const deserializeToSimpleRichText = (html: string) =>
  deserializeFromHtml(html, simpleSerializers, { noop: true, blocks: [], inlines: [SPAN_ELEMENT_TYPE] });

export const serializeFromSimpleRichText = (value: Descendant[]) => serializeToHtml(value, simpleSerializers);
