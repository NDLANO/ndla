/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  isElementOfType,
  isListItemElement,
  isParagraphElement,
  toggleHeading,
  toggleList,
  type ListType,
} from "@ndla/editor";
import { Editor, Element, Range, Transforms } from "slate";
import { HistoryEditor } from "slate-history";
import toggleBlock from "../../utils/toggleBlock";
import { BLOCK_QUOTE_ELEMENT_TYPE } from "../blockquote/blockquoteTypes";
import { getSelectionElements, type TextType } from "./toolbarState";
import type { ToolbarPluginOptions } from "./types";

type BlockShortcut =
  | { category: "block"; value: ListType | typeof BLOCK_QUOTE_ELEMENT_TYPE }
  | { category: "text"; value: Exclude<TextType, "normal-text"> };

const blockShortcuts: Record<string, BlockShortcut> = {
  "-": { category: "block", value: "bulleted-list" },
  "*": { category: "block", value: "bulleted-list" },
  "1.": { category: "block", value: "numbered-list" },
  "##": { category: "text", value: "heading-2" },
  "###": { category: "text", value: "heading-3" },
  "####": { category: "text", value: "heading-4" },
  ">": { category: "block", value: BLOCK_QUOTE_ELEMENT_TYPE },
};

const headingLevels = { "heading-2": 2, "heading-3": 3, "heading-4": 4 } as const;

/**
 * Converts a paragraph when typing a space directly after a markdown-like prefix at the start of the paragraph:
 * "-" or "*" for a bulleted list, "1." for a numbered list, "##", "###" or "####" for headings and ">" for a quote.
 * Only applies when the option is available in the toolbar for the current selection.
 * The space is inserted as regular text before the conversion is applied in a separate history batch, so undo
 * reverts the conversion and leaves the typed text (e.g. "1. ") in place.
 * Returns true if the shortcut was applied, in which case the space should not be inserted again.
 */
export const applyBlockShortcut = (editor: Editor, opts: ToolbarPluginOptions): boolean => {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return false;

  const paragraphEntry = editor.above({ match: isParagraphElement, mode: "lowest" });
  if (!paragraphEntry) return false;

  const prefixRange = { anchor: editor.start(paragraphEntry[1]), focus: selection.anchor };
  const shortcut = blockShortcuts[editor.string(prefixRange)];
  if (!shortcut || !editor.shouldShowToolbar?.()) return false;
  const [inlineInPrefix] = editor.nodes({ at: prefixRange, match: (n) => Element.isElement(n) && editor.isInline(n) });
  if (inlineInPrefix) return false;
  if (shortcut.value === BLOCK_QUOTE_ELEMENT_TYPE) {
    // toggleBlock would unwrap an existing quote.
    if (editor.above({ match: (n) => isElementOfType(n, BLOCK_QUOTE_ELEMENT_TYPE) })) return false;
  } else if (shortcut.category === "block" && editor.above({ match: isListItemElement })) {
    // Nested lists are created with tab.
    return false;
  }

  editor.selectionElements = getSelectionElements(editor, selection);
  const state = editor.toolbarState?.({ options: opts.options, areaOptions: opts.areaOptions });
  const option = state?.[shortcut.category].find((el) => el.value === shortcut.value);
  if (!option || option.disabled || option.hidden) return false;

  Transforms.insertText(editor, " ");
  const typedRange = { anchor: prefixRange.anchor, focus: editor.selection?.anchor ?? prefixRange.focus };

  const convert = () => {
    Transforms.delete(editor, { at: typedRange });
    if (shortcut.value === BLOCK_QUOTE_ELEMENT_TYPE) {
      toggleBlock(editor, BLOCK_QUOTE_ELEMENT_TYPE);
    } else if (shortcut.category === "block") {
      toggleList(editor, shortcut.value);
    } else {
      toggleHeading(editor, headingLevels[shortcut.value]);
    }
  };

  if (HistoryEditor.isHistoryEditor(editor)) {
    HistoryEditor.withNewBatch(editor, () => Editor.withoutNormalizing(editor, convert));
  } else {
    Editor.withoutNormalizing(editor, convert);
  }
  return true;
};
