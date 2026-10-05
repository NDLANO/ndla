/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSlate, LoggerManager } from "@ndla/editor";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { parseSimpleRichText } from "../parseSimpleRichText";
import { simpleRichTextPlugins } from "../RichTextEditor";
import { deserializeToSimpleRichText, serializeFromSimpleRichText } from "../richTextSerialization";

const normalizeHtml = (html: string) => {
  const editor = createSlate({
    value: deserializeToSimpleRichText(html),
    plugins: simpleRichTextPlugins,
    logger: new LoggerManager({ debug: false }),
    shouldNormalize: true,
  });
  return serializeFromSimpleRichText(editor.children);
};

describe("simple rich text serialization", () => {
  test.each([
    "",
    "Hva er 2+2?",
    "A &amp; B",
    'Hva er <strong>fet</strong>, <em>kursiv</em> og <span lang="en">english</span>?',
    "Første linje<br/>andre <strong>linje</strong>",
  ])("keeps %j unchanged", (html) => {
    expect(normalizeHtml(html)).toBe(html);
  });

  test("merges multiple paragraphs into a single paragraph", () => {
    expect(normalizeHtml("<p>a</p><p>b</p>")).toBe("ab");
  });

  test("removes unsupported marks", () => {
    expect(normalizeHtml("<u>under</u>")).toBe("under");
  });
});

describe("parseSimpleRichText", () => {
  test("only renders supported elements", () => {
    const html =
      '<img src="x" onerror="alert(1)">hei <strong>fet</strong> <em>kursiv</em><br><script>alert(2)</script><iframe srcdoc="x"></iframe><span lang="en" onclick="x">en</span>';
    expect(renderToStaticMarkup(<>{parseSimpleRichText(html)}</>)).toBe(
      'hei <strong>fet</strong> <em>kursiv</em><br/>alert(2)<span lang="en">en</span>',
    );
  });
});
