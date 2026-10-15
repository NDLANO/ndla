/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Descendant } from "slate";
import { createSlate } from "../../../editor/createSlate";
import { paragraphPlugin } from "../../paragraph/paragraphPlugin";
import { PARAGRAPH_ELEMENT_TYPE } from "../../paragraph/paragraphTypes";
import { softBreakPlugin } from "../softBreakPlugin";

describe("soft break transforms", () => {
  const value: Descendant[] = [{ type: PARAGRAPH_ELEMENT_TYPE, children: [{ text: "Text" }] }];

  it("should keep newlines as soft breaks when pasting as plain text", () => {
    const editor = createSlate({
      plugins: [paragraphPlugin, softBreakPlugin.configure({ options: { pasteNewlinesAsSoftBreaks: true } })],
      value,
      shouldNormalize: true,
    });
    editor.select({ path: [0, 0], offset: 4 });
    editor.insertData({ getData: () => " a\r\nb\rc" } as unknown as DataTransfer);
    expect(editor.children).toEqual([{ type: PARAGRAPH_ELEMENT_TYPE, children: [{ text: "Text a\nb\nc" }] }]);
  });
});
