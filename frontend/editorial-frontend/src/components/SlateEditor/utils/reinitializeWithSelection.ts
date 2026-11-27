/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Editor, Node, Text, Transforms, type Point, type Range } from "slate";

const isSelectablePoint = (editor: Editor, point: Point) => {
  if (!Editor.hasPath(editor, point.path)) return false;
  const node = Node.get(editor, point.path);
  return Text.isText(node) && point.offset <= node.text.length;
};

export const isSelectableRange = (editor: Editor, range: Range) =>
  isSelectablePoint(editor, range.anchor) && isSelectablePoint(editor, range.focus);

export const reinitializeWithSelection = (
  editor: Editor,
  options: Parameters<Editor["reinitialize"]>[0],
): Range | null => {
  const selection = editor.selection;
  Transforms.deselect(editor);
  editor.reinitialize(options);
  if (!selection || !isSelectableRange(editor, selection)) return null;
  Transforms.select(editor, selection);
  return selection;
};
