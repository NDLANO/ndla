/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Editor, Transforms, type Descendant } from "slate";
import { createSlate } from "../../../editor/createSlate";
import { paragraphPlugin } from "../../paragraph/paragraphPlugin";
import { PARAGRAPH_ELEMENT_TYPE } from "../../paragraph/paragraphTypes";
import { sectionPlugin } from "../../section/sectionPlugin";
import { SECTION_ELEMENT_TYPE } from "../../section/sectionTypes";
import { markPlugin } from "../markPlugin";
import type { MarkType } from "../markTypes";

const wrap = (children: Descendant[]): Descendant[] => [
  { type: SECTION_ELEMENT_TYPE, children: [{ type: PARAGRAPH_ELEMENT_TYPE, children }] },
];

const setup = (text: string, supportedMarks?: MarkType[]) => {
  const editor = createSlate({
    plugins: [
      sectionPlugin,
      paragraphPlugin,
      markPlugin.configure({
        options: {
          markdownShortcuts: true,
          ...(supportedMarks ? { supportedMarks: { value: supportedMarks, override: true } } : {}),
        },
      }),
    ],
    value: wrap([{ text: "" }]),
  });
  Transforms.select(editor, Editor.start(editor, []));
  type(editor, text);
  return editor;
};

const type = (editor: Editor, text: string) => {
  for (const char of text) {
    editor.insertText(char);
  }
};

describe("markdown shortcuts", () => {
  test("backticks turn text into code", () => {
    const editor = setup("hello `world` there");
    expect(editor.children).toEqual(wrap([{ text: "hello " }, { text: "world", code: true }, { text: " there" }]));
  });

  test("underscores turn text into italic", () => {
    const editor = setup("_hello_");
    expect(editor.children).toEqual(wrap([{ text: "hello", italic: true }]));
  });

  test("stars turn text into bold", () => {
    const editor = setup("a *bold text* b");
    expect(editor.children).toEqual(wrap([{ text: "a " }, { text: "bold text", bold: true }, { text: " b" }]));
  });

  test("text typed after the shortcut is not marked", () => {
    const editor = setup("*bold*x");
    expect(editor.children).toEqual(wrap([{ text: "bold", bold: true }, { text: "x" }]));
  });

  test("does not trigger inside words", () => {
    const editor = setup("snake_case_var");
    expect(editor.children).toEqual(wrap([{ text: "snake_case_var" }]));
  });

  test("does not trigger when content is surrounded by whitespace", () => {
    const editor = setup("2 * 3 * 4");
    expect(editor.children).toEqual(wrap([{ text: "2 * 3 * 4" }]));
  });

  test("does not trigger for empty content", () => {
    const editor = setup("``");
    expect(editor.children).toEqual(wrap([{ text: "``" }]));
  });

  test("does not trigger inside code", () => {
    const editor = setup("`ab`");
    Transforms.select(editor, { path: [0, 0, 0], offset: 1 });
    type(editor, " *x* ");
    expect(editor.children).toEqual(wrap([{ text: "a *x* b", code: true }]));
  });

  test("does not trigger for unsupported marks", () => {
    const editor = setup("`code`", ["bold", "italic"]);
    expect(editor.children).toEqual(wrap([{ text: "`code`" }]));
  });

  test("is disabled by default", () => {
    const editor = createSlate({
      plugins: [sectionPlugin, paragraphPlugin, markPlugin],
      value: wrap([{ text: "" }]),
    });
    Transforms.select(editor, Editor.start(editor, []));
    type(editor, "*bold*");
    expect(editor.children).toEqual(wrap([{ text: "*bold*" }]));
  });
});
