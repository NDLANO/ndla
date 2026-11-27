/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSlate, PARAGRAPH_ELEMENT_TYPE, SECTION_ELEMENT_TYPE } from "@ndla/editor";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Node } from "slate";
import { Editable, Slate } from "slate-react";
import { anySlateElementId } from "../../../../../__tests__/vitest.setup";
import { learningResourcePlugins } from "../../../../../containers/ArticlePage/LearningResourcePage/components/learningResourcePlugins";
import { learningResourceRenderers } from "../../../../../containers/ArticlePage/LearningResourcePage/components/learningResourceRenderers";
import { blockContentToEditorValue } from "../../../../../util/articleContentConverter";

const errors: string[] = [];
const onError = (event: ErrorEvent) => {
  errors.push(event.message);
  event.preventDefault();
};

beforeEach(() => {
  errors.length = 0;
  window.addEventListener("error", onError);
});

afterEach(() => {
  window.removeEventListener("error", onError);
});

const setup = (html: string) => {
  const editor = createSlate({ plugins: [...learningResourcePlugins, ...learningResourceRenderers] });
  editor.reinitialize({ value: blockContentToEditorValue(html), shouldNormalize: true });
  render(
    <Slate editor={editor} initialValue={editor.children}>
      <Editable renderElement={(props) => editor.renderElement!(props)!} />
    </Slate>,
  );
  return editor;
};

const removeButtons = () => screen.queryAllByRole("button", { name: "Fjern seksjon" });

describe("Section", () => {
  test("removing every section leaves an empty section instead of an empty editor", async () => {
    const editor = setup("<section><p>En</p></section><section><p>To</p></section>");

    for (let i = 0; i < 2 && removeButtons().length; i++) {
      await act(async () => fireEvent.click(removeButtons()[0]!));
    }

    expect(errors).toEqual([]);
    expect(editor.children).toEqual([
      {
        type: SECTION_ELEMENT_TYPE,
        id: anySlateElementId,
        children: [{ type: PARAGRAPH_ELEMENT_TYPE, id: anySlateElementId, children: [{ text: "" }] }],
      },
    ]);

    act(() => editor.undo());
    expect(Node.string(editor)).toBe("To");
  });
});
