/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { injectWindowData } from "../serverHelpers";

const shell = `<script>window.DATA = "$WINDOW_DATA"</script>`;

const parseWindowData = (html: string) => {
  const match = /window\.DATA = (.*)<\/script>/.exec(html);
  if (!match?.[1]) throw new Error(`No window.DATA found in ${html}`);
  return JSON.parse(match[1]);
};

test("injects the serialized data into the placeholder", () => {
  const html = injectWindowData(shell, { hash: "abc123" });
  expect(parseWindowData(html)).toEqual({ hash: "abc123", config: { isClient: true } });
});

test("always marks the config as client-side", () => {
  const html = injectWindowData(shell, { config: { isClient: false, defaultLocale: "nb" } });
  expect(parseWindowData(html).config).toEqual({ isClient: true, defaultLocale: "nb" });
});

// `String.prototype.replace` treats `$$`, `$&`, `` $` `` and `$'` in a string replacement as replacement patterns
test.each([
  ["dollars", "display math $$x^2$$"],
  ["ampersand", "sed backreference $& here"],
  ["backtick", "shell $` here"],
  ["single quote", "regex $' here"],
  ["all of them", "$$ $& $` $' $"],
])("preserves %s in serialized content", (_name, text) => {
  const html = injectWindowData(shell, { text });
  expect(parseWindowData(html).text).toBe(text);
});
