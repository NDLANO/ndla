/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { KeyboardEvent } from "react";
import { Editor, Node, Range, Text, Transforms } from "slate";
import { KEY_ENTER } from "../../utils/keys";

const replaceConsecutiveChars = (
  event: KeyboardEvent<HTMLDivElement>,
  editor: Editor,
  char: string,
  replacement: string,
) => {
  if (editor.selection) {
    const start = Range.isForward(editor.selection) ? editor.selection?.anchor : editor.selection?.focus;
    if (start.offset > 0) {
      const startText = Editor.leaf(editor, start);
      const previousChar = startText[0].text.slice(start.offset - 1, start.offset);
      if (previousChar === char) {
        event.preventDefault();
        Transforms.move(editor, {
          distance: 1,
          reverse: true,
          edge: "start",
        });
        editor.deleteBackward("character");
        editor.insertText(replacement);
      }
    }
  }
};

/**
 * Replaces ".." with an ellipsis when typing a third ".". Code is left untouched.
 */
const replaceEllipsis = (editor: Editor) => {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return false;
  const { path, offset } = selection.anchor;
  if (offset < 2) return false;
  const node = Node.get(editor, path);
  if (!Text.isText(node) || node.code || node.text.slice(offset - 2, offset) !== "..") return false;

  Transforms.delete(editor, { at: { anchor: { path, offset: offset - 2 }, focus: { path, offset } } });
  Transforms.insertText(editor, "…");
  return true;
};

export const textTransformPlugin = (editor: Editor) => {
  const { onKeyDown: nextOnKeyDown, insertText } = editor;

  editor.insertText = (text, options) => {
    if (text === "." && !options?.at && replaceEllipsis(editor)) return;
    insertText(text, options);
  };

  editor.onKeyDown = (e) => {
    if (e.key === "<") {
      replaceConsecutiveChars(e, editor, "<", "«");
    } else if (e.key === ">") {
      replaceConsecutiveChars(e, editor, ">", "»");
    } else if (e.shiftKey === true && e.key === KEY_ENTER) {
      e.preventDefault();
      editor.insertText("\n");
    } else if (nextOnKeyDown) {
      nextOnKeyDown(e);
    }
  };

  return editor;
};
