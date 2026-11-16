/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { applyMarkdownShortcut, markdownShortcutMarks } from "@ndla/editor";
import type { Editor } from "slate";
import { getSelectionElements } from "./toolbarState";

export const applyMarkShortcut = (editor: Editor, char: string): boolean => {
  const mark = markdownShortcutMarks[char];
  if (!mark || !editor.selection || !editor.shouldShowToolbar?.()) return false;
  editor.selectionElements = getSelectionElements(editor, editor.selection);
  const option = editor.toolbarState?.({}).mark.find((el) => el.value === mark);
  if (!option || option.disabled || option.hidden) return false;
  return applyMarkdownShortcut(editor, char);
};
