/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CustomEditor as _CustomEditor,
  BreakElement,
  HeadingElement,
  ListElement,
  ListItemElement,
  NoopElement,
  ParagraphElement,
  SectionElement,
} from "@ndla/editor";
import type { Editor, Descendant, BaseEditor, BaseSelection, Node, Element } from "slate";
import type { HistoryEditor } from "slate-history";
import type { ReactEditor } from "slate-react";
import type { AsideElement } from "./plugins/aside/asideTypes";
import type { AudioElement } from "./plugins/audio/audioTypes";
import type { BlockQuoteElement } from "./plugins/blockquote/blockquoteTypes";
import type { CampaignBlockElement } from "./plugins/campaignBlock/types";
import type { CodeBlockElement } from "./plugins/codeBlock/types";
import type { CommentBlockElement } from "./plugins/comment/block/types";
import type { CommentInlineElement } from "./plugins/comment/inline/types";
import type { ConceptBlockElement } from "./plugins/concept/block/types";
import type { ConceptInlineElement } from "./plugins/concept/inline/types";
import type { ContactBlockElement } from "./plugins/contactBlock/types";
import type { CopyrightElement } from "./plugins/copyright/types";
import type {
  DefinitionListElement,
  DefinitionDescriptionElement,
  DefinitionTermElement,
} from "./plugins/definitionList/definitionListTypes";
import type { DetailsElement } from "./plugins/details/detailsTypes";
import type { SummaryElement } from "./plugins/details/summaryTypes";
import type { DivElement } from "./plugins/div/types";
import type { ErrorEmbedElement } from "./plugins/embed/types";
import type { ExternalElement, IframeElement } from "./plugins/external/types";
import type { FileElement } from "./plugins/file";
import type { FootnoteElement } from "./plugins/footnote/types";
import type { FramedContentElement } from "./plugins/framedContent/framedContentTypes";
import type { GridCellElement, GridElement } from "./plugins/grid/types";
import type { H5pElement } from "./plugins/h5p/types";
import type { ImageElement } from "./plugins/image/types";
import type { KeyFigureElement } from "./plugins/keyFigure/types";
import type { ContentLinkElement, LinkElement } from "./plugins/link";
import type { LinkBlockListElement } from "./plugins/linkBlockList/types";
import type { CustomTextWithMarks } from "./plugins/mark";
import type { MathmlElement } from "./plugins/mathml/mathTypes";
import type { PitchElement } from "./plugins/pitch/types";
import type { RelatedElement } from "./plugins/related/types";
import type { RephraseElement } from "./plugins/rephrase/rephraseTypes";
import type { SpanElement } from "./plugins/span/types";
import type { SymbolElement } from "./plugins/symbol/types";
import type {
  TableBodyElement,
  TableCaptionElement,
  TableCellElement,
  TableElement,
  TableHeadElement,
  TableRowElement,
} from "./plugins/table/interfaces";
import type { AreaFilters, CategoryFilters, ToolbarType } from "./plugins/toolbar/toolbarState";
import type { UnsupportedElement } from "./plugins/unsupported/types";
import type { DisclaimerElement } from "./plugins/uuDisclaimer/types";
import type { BrightcoveEmbedElement } from "./plugins/video/types";

export type SlatePlugin = (editor: Editor) => Editor;

export interface SlateSerializer {
  deserialize: (el: HTMLElement, children: Descendant[]) => Descendant | Descendant[] | undefined;
  serialize: (node: Descendant, children: string | undefined) => string | undefined;
}

export interface CustomEditor extends _CustomEditor {
  lastSelection?: BaseSelection;
  selectionElements: {
    elements: Element[];
    multipleBlocksOnSameLevel: boolean;
  };
  lastSelectedBlock?: Node;
  shouldShowToolbar?: () => boolean;
  shouldHideBlockPicker?: () => boolean | undefined;
  isDragDisabled?: (element: Element) => boolean | undefined;
  toolbarState?: (opts: { options?: CategoryFilters; areaOptions?: AreaFilters }) => ToolbarType;
}

type CustomElement =
  | ParagraphElement
  | SectionElement
  | BreakElement
  | LinkElement
  | ContentLinkElement
  | BlockQuoteElement
  | HeadingElement
  | ListElement
  | ListItemElement
  | FootnoteElement
  | MathmlElement
  | ConceptInlineElement
  | ConceptBlockElement
  | AsideElement
  | FileElement
  | DetailsElement
  | SummaryElement
  | CodeBlockElement
  | TableElement
  | TableCaptionElement
  | TableRowElement
  | TableCellElement
  | TableHeadElement
  | TableBodyElement
  | RelatedElement
  | BrightcoveEmbedElement
  | AudioElement
  | ImageElement
  | ErrorEmbedElement
  | H5pElement
  | FramedContentElement
  | DivElement
  | SpanElement
  | DefinitionListElement
  | DefinitionDescriptionElement
  | DefinitionTermElement
  | PitchElement
  | GridElement
  | GridCellElement
  | KeyFigureElement
  | ContactBlockElement
  | CampaignBlockElement
  | LinkBlockListElement
  | DisclaimerElement
  | NoopElement
  | ExternalElement
  | IframeElement
  | CopyrightElement
  | CommentInlineElement
  | CommentBlockElement
  | RephraseElement
  | SymbolElement
  | UnsupportedElement;

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor & CustomEditor;
    Element: CustomElement & { id?: string };
    Text: CustomTextWithMarks;
  }
}

export type ElementType = Element["type"];
