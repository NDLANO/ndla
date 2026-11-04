/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isListItemElement, isParagraphElement, toggleHeading, toggleList, type ListType } from "@ndla/editor";
import { Editor, Range, Transforms } from "slate";
import { getSelectionElements, type TextType } from "./toolbarState";
import type { ToolbarPluginOptions } from "./types";

type BlockShortcut =
  | { category: "block"; value: ListType }
  | { category: "text"; value: Exclude<TextType, "normal-text"> };

const blockShortcuts: Record<string, BlockShortcut> = {
  "-": { category: "block", value: "bulleted-list" },
  "*": { category: "block", value: "bulleted-list" },
  "1.": { category: "block", value: "numbered-list" },
  "##": { category: "text", value: "heading-2" },
  "###": { category: "text", value: "heading-3" },
  "####": { category: "text", value: "heading-4" },
};

const headingLevels = { "heading-2": 2, "heading-3": 3, "heading-4": 4 } as const;

/**
 * Converts a paragraph when typing a space directly after a markdown-like prefix at the start of the paragraph:
 * "-" or "*" for a bulleted list, "1." for a numbered list and "##", "###" or "####" for headings.
 * Only applies when the option is available in the toolbar for the current selection.
 * Returns true if the shortcut was applied, in which case the space should not be inserted.
 */
export const applyBlockShortcut = (editor: Editor, opts: ToolbarPluginOptions): boolean => {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return false;

  const paragraphEntry = editor.above({ match: isParagraphElement, mode: "lowest" });
  if (!paragraphEntry) return false;

  const prefixRange = { anchor: editor.start(paragraphEntry[1]), focus: selection.anchor };
  const shortcut = blockShortcuts[editor.string(prefixRange)];
  if (!shortcut || !editor.shouldShowToolbar?.()) return false;
  // Nested lists are created with tab.
  if (shortcut.category === "block" && editor.above({ match: isListItemElement })) return false;

  editor.selectionElements = getSelectionElements(editor, selection);
  const state = editor.toolbarState?.({ options: opts.options, areaOptions: opts.areaOptions });
  const option = state?.[shortcut.category].find((el) => el.value === shortcut.value);
  if (!option || option.disabled || option.hidden) return false;

  Editor.withoutNormalizing(editor, () => {
    Transforms.delete(editor, { at: prefixRange });
    if (shortcut.category === "block") {
      toggleList(editor, shortcut.value);
    } else {
      toggleHeading(editor, headingLevels[shortcut.value]);
    }
  });
  return true;
};
