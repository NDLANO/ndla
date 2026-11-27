/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSlate } from "@ndla/editor";
import { Editor, Node, Transforms } from "slate";
import { learningResourcePlugins } from "../../../../containers/ArticlePage/LearningResourcePage/components/learningResourcePlugins";
import { blockContentToEditorValue, blockContentToHTML } from "../../../../util/articleContentConverter";
import { isSelectableRange, reinitializeWithSelection } from "../reinitializeWithSelection";

const longText = "Dette avsnittet er lengre enn teksten i oppsummeringen til detaljer-blokken";
const details = "<details><summary>Til læreren</summary><p>Innhold</p></details>";

const setup = (html: string) => {
  const editor = createSlate({ plugins: learningResourcePlugins });
  editor.reinitialize({ value: blockContentToEditorValue(html), shouldNormalize: true });
  return editor;
};

const selectInText = (editor: Editor, text: string, offset: number) => {
  const [entry] = Editor.nodes(editor, { at: [], match: (n) => Node.isText(n) && n.text === text });
  Transforms.select(editor, { path: entry![1], offset });
  return editor.selection!;
};

describe("isSelectableRange", () => {
  test("is true for a point inside a text node", () => {
    const editor = setup(`<section><p>Start</p><p>${longText}</p></section>`);
    const selection = selectInText(editor, longText, 10);
    expect(isSelectableRange(editor, selection)).toBe(true);
  });

  test("is false when the path refers to an element", () => {
    const editor = setup(`<section><p>Start</p>${details}</section>`);
    const point = { path: [0, 1, 0], offset: 0 };
    expect(Node.get(editor, point.path)).toMatchObject({ type: "summary" });
    expect(isSelectableRange(editor, { anchor: point, focus: point })).toBe(false);
  });

  test("is false when the offset is past the end of the text", () => {
    const editor = setup("<section><p>Start</p><p>Kort</p></section>");
    const point = { path: [0, 1, 0], offset: 10 };
    expect(isSelectableRange(editor, { anchor: point, focus: point })).toBe(false);
  });

  test("is false when the path does not exist", () => {
    const editor = setup("<section><p>Start</p></section>");
    const point = { path: [0, 5, 0], offset: 0 };
    expect(isSelectableRange(editor, { anchor: point, focus: point })).toBe(false);
  });
});

describe("reinitializeWithSelection", () => {
  test("keeps the selection when the saved value has the same structure", () => {
    const editor = setup(`<section><p>Start</p>${details}<p>${longText}</p></section>`);
    const selection = selectInText(editor, longText, 40);
    const savedValue = blockContentToEditorValue(blockContentToHTML(editor.children));

    const restored = reinitializeWithSelection(editor, { value: savedValue, shouldNormalize: true });

    expect(restored).toEqual(selection);
    expect(editor.selection).toEqual(selection);
    expect(Node.string(Node.get(editor, selection.anchor.path))).toBe(longText);
  });

  test("drops the selection when its path refers to an element in the saved value", () => {
    const editor = setup(`<section><p>Start</p><p>${longText}</p></section>`);
    const selection = selectInText(editor, longText, 60);
    expect(selection.anchor.path).toEqual([0, 1, 0]);

    const restored = reinitializeWithSelection(editor, {
      value: blockContentToEditorValue(`<section><p>Start</p>${details}<p>${longText}</p></section>`),
      shouldNormalize: true,
    });

    expect(Editor.hasPath(editor, selection.anchor.path)).toBe(true);
    expect(restored).toBeNull();
    expect(editor.selection).toBeNull();
  });

  test("drops the selection when its offset is past the end of the text in the saved value", () => {
    const editor = setup(`<section><p>Start</p><p>${longText}</p></section>`);
    selectInText(editor, longText, 60);

    const restored = reinitializeWithSelection(editor, {
      value: blockContentToEditorValue("<section><p>Start</p><p>Kort</p></section>"),
      shouldNormalize: true,
    });

    expect(restored).toBeNull();
    expect(editor.selection).toBeNull();
  });
});
