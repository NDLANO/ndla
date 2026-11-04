/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createSlate,
  LIST_ELEMENT_TYPE,
  LIST_ITEM_ELEMENT_TYPE,
  PARAGRAPH_ELEMENT_TYPE,
  SECTION_ELEMENT_TYPE,
  type SlatePlugin,
} from "@ndla/editor";
import { Editor, Node, Transforms, type Descendant } from "slate";
import { plugins as commentPlugins } from "../../../../../containers/ArticlePage/components/commentToolbarUtils";
import { learningResourcePlugins } from "../../../../../containers/ArticlePage/LearningResourcePage/components/learningResourcePlugins";

const paragraph = (text: string): Descendant => ({ type: PARAGRAPH_ELEMENT_TYPE, children: [{ text }] });

const setup = (plugins: SlatePlugin[], children: Descendant[], text: string) => {
  const editor = createSlate({ plugins });
  editor.reinitialize({ value: [{ type: SECTION_ELEMENT_TYPE, children }], shouldNormalize: true });
  Transforms.select(editor, Editor.start(editor, [0, 0]));
  for (const char of text) {
    editor.insertText(char);
  }
  return editor;
};

const findList = (editor: Editor) => {
  const [entry] = editor.nodes({ at: [], match: (n) => Node.isElement(n) && n.type === LIST_ELEMENT_TYPE });
  return entry?.[0];
};

const text = (editor: Editor) => Node.string(editor);

describe("list shortcuts", () => {
  test.each([
    ["- ", "bulleted-list"],
    ["* ", "bulleted-list"],
    ["1. ", "numbered-list"],
  ])("typing '%s' at the start of a paragraph creates a %s", (prefix, listType) => {
    const editor = setup(learningResourcePlugins, [paragraph("")], `${prefix}Hello`);
    expect(findList(editor)).toMatchObject({
      type: LIST_ELEMENT_TYPE,
      listType,
      children: [{ type: LIST_ITEM_ELEMENT_TYPE, children: [paragraph("Hello")] }],
    });
  });

  test("works on a paragraph that already has text", () => {
    const editor = setup(learningResourcePlugins, [paragraph("Hello")], "- ");
    expect(findList(editor)).toMatchObject({
      type: LIST_ELEMENT_TYPE,
      listType: "bulleted-list",
      children: [{ type: LIST_ITEM_ELEMENT_TYPE, children: [paragraph("Hello")] }],
    });
    expect(editor.selection && Node.parent(editor, editor.selection.anchor.path)).toMatchObject(paragraph("Hello"));
    expect(editor.selection?.anchor.offset).toBe(0);
  });

  test("does not trigger when the prefix is not at the start of the paragraph", () => {
    const editor = setup(learningResourcePlugins, [paragraph("")], "a - b 1. c");
    expect(findList(editor)).toBeUndefined();
    expect(text(editor)).toBe("a - b 1. c");
  });

  test("does not trigger for other numbers", () => {
    const editor = setup(learningResourcePlugins, [paragraph("")], "2. ");
    expect(findList(editor)).toBeUndefined();
    expect(text(editor)).toBe("2. ");
  });

  test("does not trigger inside a list", () => {
    const editor = setup(
      learningResourcePlugins,
      [
        {
          type: LIST_ELEMENT_TYPE,
          listType: "numbered-list",
          data: {},
          children: [{ type: LIST_ITEM_ELEMENT_TYPE, children: [paragraph("")] }],
        },
      ],
      "",
    );
    const itemPath = editor
      .nodes({ at: [], match: (n) => Node.isElement(n) && n.type === LIST_ITEM_ELEMENT_TYPE })
      .next().value?.[1];
    if (!itemPath) throw new Error("Expected list item");
    Transforms.select(editor, Editor.start(editor, itemPath));
    editor.insertText("-");
    editor.insertText(" ");
    expect(findList(editor)).toMatchObject({
      type: LIST_ELEMENT_TYPE,
      listType: "numbered-list",
      children: [{ type: LIST_ITEM_ELEMENT_TYPE, children: [paragraph("- ")] }],
    });
  });

  test("only triggers for list types available in the toolbar", () => {
    const bulleted = setup(commentPlugins, [paragraph("")], "- ");
    expect(findList(bulleted)).toMatchObject({ type: LIST_ELEMENT_TYPE, listType: "bulleted-list" });

    const numbered = setup(commentPlugins, [paragraph("")], "1. ");
    expect(findList(numbered)).toBeUndefined();
    expect(text(numbered)).toBe("1. ");
  });
});
