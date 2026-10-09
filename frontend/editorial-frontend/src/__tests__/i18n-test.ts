/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getLocaleInfoFromPath, isValidLocale } from "../i18n";

test("i18n isValidLocale()", () => {
  expect(isValidLocale("nb")).toBe(true);
  expect(isValidLocale("nn")).toBe(true);
  expect(isValidLocale("en")).toBe(true);
  expect(isValidLocale("aa")).toBe(false);
  expect(isValidLocale("ub")).toBe(false);
  expect(isValidLocale("se")).toBe(false);
});

test.each([
  ["/nn/structure", { basepath: "/structure", basename: "nn", abbreviation: "nn" }],
  ["/en", { basepath: "/", basename: "en", abbreviation: "en" }],
  ["/structure/nn", { basepath: "/structure/nn", basename: "", abbreviation: "nb" }],
  ["/se/structure", { basepath: "/se/structure", basename: "", abbreviation: "nb" }],
  ["/", { basepath: "/", basename: "", abbreviation: "nb" }],
])("i18n getLocaleInfoFromPath(%s)", (path, expected) => {
  expect(getLocaleInfoFromPath(path)).toEqual(expected);
});
