/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createSlate,
  HEADING_ELEMENT_TYPE,
  PARAGRAPH_ELEMENT_TYPE,
  SECTION_ELEMENT_TYPE,
  type SlatePlugin,
} from "@ndla/editor";
import { Editor, Node, Transforms, type Descendant } from "slate";
import { toolbarPlugin } from "..";
import { learningResourcePlugins } from "../../../../../containers/ArticlePage/LearningResourcePage/components/learningResourcePlugins";
import { markPlugin } from "../../mark";
import { createToolbarDefaultValues } from "../toolbarState";

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

describe("mark shortcuts", () => {
  test("applies marks available in the toolbar", () => {
    const editor = setup(learningResourcePlugins, [paragraph("")], "*bold* _italic_ `code`");
    expect(Node.get(editor, [0, 0])).toMatchObject({
      children: [
        { text: "bold", bold: true },
        { text: " " },
        { text: "italic", italic: true },
        { text: " " },
        { text: "code", code: true },
      ],
    });
  });

  test("does not apply marks hidden in the toolbar for the current area", () => {
    const editor = setup(
      learningResourcePlugins,
      [{ type: HEADING_ELEMENT_TYPE, level: 2, children: [{ text: "Hello" }] }, paragraph("")],
      "*bold* _italic_ ",
    );
    expect(Node.get(editor, [0, 0])).toMatchObject({
      type: HEADING_ELEMENT_TYPE,
      children: [{ text: "*bold* " }, { text: "italic", italic: true }, { text: " Hello" }],
    });
  });

  test("does not apply marks hidden in the toolbar options", () => {
    const toolbar = toolbarPlugin.configure({
      options: { options: createToolbarDefaultValues({ mark: { code: { hidden: true } } }) },
    });
    const editor = setup([markPlugin, toolbar], [paragraph("")], "`code`");
    expect(Node.string(editor)).toBe("`code`");
  });

  test("does not apply marks without a toolbar", () => {
    const editor = setup([markPlugin], [paragraph("")], "_italic_");
    expect(Node.string(editor)).toBe("_italic_");
  });
});
