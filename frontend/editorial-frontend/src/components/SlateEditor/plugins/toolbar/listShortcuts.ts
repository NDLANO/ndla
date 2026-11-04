/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isListItemElement, isParagraphElement, toggleList, type ListType } from "@ndla/editor";
import { Editor, Range, Transforms } from "slate";
import { getSelectionElements } from "./toolbarState";
import type { ToolbarPluginOptions } from "./types";

const listShortcuts: Record<string, ListType> = {
  "-": "bulleted-list",
  "*": "bulleted-list",
  "1.": "numbered-list",
};

/**
 * Converts a paragraph to a list when typing a space directly after "-", "*" or "1." at the start of the paragraph.
 * Only applies when the list type is available in the toolbar for the current selection.
 * Returns true if the shortcut was applied, in which case the space should not be inserted.
 */
export const applyListShortcut = (editor: Editor, opts: ToolbarPluginOptions): boolean => {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return false;

  const paragraphEntry = editor.above({ match: isParagraphElement, mode: "lowest" });
  if (!paragraphEntry || editor.above({ match: isListItemElement })) return false;

  const prefixRange = { anchor: editor.start(paragraphEntry[1]), focus: selection.anchor };
  const listType = listShortcuts[editor.string(prefixRange)];
  if (!listType || !editor.shouldShowToolbar?.()) return false;

  editor.selectionElements = getSelectionElements(editor, selection);
  const state = editor.toolbarState?.({ options: opts.options, areaOptions: opts.areaOptions });
  const option = state?.block.find((el) => el.value === listType);
  if (!option || option.disabled || option.hidden) return false;

  Editor.withoutNormalizing(editor, () => {
    Transforms.delete(editor, { at: prefixRange });
    toggleList(editor, listType);
  });
  return true;
};
