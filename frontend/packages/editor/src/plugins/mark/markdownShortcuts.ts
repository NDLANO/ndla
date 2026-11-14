/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Editor, Node, Range, Text, Transforms } from "slate";
import type { MarkType } from "./markTypes";

export const markdownShortcutMarks: Record<string, MarkType> = {
  "`": "code",
  _: "italic",
  "*": "bold",
};

const WORD_CHAR = /[\p{L}\p{N}]/u;
const WHITESPACE = /\s/;

/**
 * Attempts to apply a markdown-like mark shortcut when `char` is typed.
 * Typing a delimiter (`, _ or *) closes a previously typed delimiter of the same kind in the same text node,
 * removing both delimiters and marking the text in between.
 * Returns true if the shortcut was applied, in which case `char` should not be inserted.
 */
export const applyMarkdownShortcut = (editor: Editor, char: string): boolean => {
  const mark = markdownShortcutMarks[char];
  const { selection } = editor;
  if (!mark || !selection || !Range.isCollapsed(selection) || !editor.supportsMark(mark)) return false;

  const { path, offset } = selection.anchor;
  const node = Node.get(editor, path);
  if (!Text.isText(node) || node.code) return false;

  const before = node.text.slice(0, offset);
  const openIndex = before.lastIndexOf(char);
  if (openIndex === -1) return false;

  const content = before.slice(openIndex + 1);
  if (!content.length || WHITESPACE.test(content.charAt(0)) || WHITESPACE.test(content.charAt(content.length - 1))) {
    return false;
  }

  // Avoid triggering in the middle of words, such as snake_case or 2*3*4.
  const charBeforeOpen = before[openIndex - 1];
  if (charBeforeOpen && WORD_CHAR.test(charBeforeOpen)) return false;

  editor.withoutNormalizing(() => {
    Transforms.delete(editor, {
      at: { path, offset: openIndex },
      distance: 1,
      unit: "character",
    });
    const markRange = { anchor: { path, offset: openIndex }, focus: { path, offset: offset - 1 } };
    const rangeRef = Editor.rangeRef(editor, markRange);
    Transforms.setNodes(editor, { [mark]: true }, { at: markRange, match: Text.isText, split: true });
    const range = rangeRef.unref();
    if (range) {
      Transforms.select(editor, Range.end(range));
    }
  });
  // Make sure text typed after the shortcut is not marked.
  editor.removeMark(mark);
  return true;
};
