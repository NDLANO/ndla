/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSlate, PARAGRAPH_ELEMENT_TYPE, SECTION_ELEMENT_TYPE } from "@ndla/editor";
import { Editor, Node, Transforms, type Descendant } from "slate";
import { learningResourcePlugins } from "../../../../../containers/ArticlePage/LearningResourcePage/components/learningResourcePlugins";

const setup = (text: string, children: Descendant[] = [{ text: "" }]) => {
  const editor = createSlate({ plugins: learningResourcePlugins });
  editor.reinitialize({
    value: [{ type: SECTION_ELEMENT_TYPE, children: [{ type: PARAGRAPH_ELEMENT_TYPE, children }] }],
    shouldNormalize: true,
  });
  Transforms.select(editor, Editor.end(editor, [0, 0]));
  for (const char of text) {
    editor.insertText(char);
  }
  return editor;
};

describe("ellipsis", () => {
  test("three dots turn into an ellipsis", () => {
    const editor = setup("Vent...");
    expect(Node.string(editor)).toBe("Vent…");
  });

  test("more dots after an ellipsis are left as is", () => {
    const editor = setup("Vent....");
    expect(Node.string(editor)).toBe("Vent….");
  });

  test("dots in code are left as is", () => {
    const editor = setup("...", [{ text: "fn(", code: true }]);
    expect(Node.string(editor)).toBe("fn(...");
  });
});
