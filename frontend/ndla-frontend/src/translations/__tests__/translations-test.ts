/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getUntranslatedKeys, validateTranslationFiles } from "@ndla/util";
import en from "../translations-en";
import nb from "../translations-nb";
import nn from "../translations-nn";
import se from "../translations-se";

test("That all translations has all language keys", () => {
  const anyMissing = validateTranslationFiles(
    [
      { languageName: "Norsk bokmål", translationObject: nb },
      { languageName: "Norsk nynorsk", translationObject: nn },
      { languageName: "English", translationObject: en },
    ],
    "only-on-error",
  );

  expect(anyMissing).toBe(false);
});

test("keys still awaiting translation", () => {
  expect({
    nb: getUntranslatedKeys(nb),
    nn: getUntranslatedKeys(nn),
    en: getUntranslatedKeys(en),
    se: getUntranslatedKeys(se),
  }).toMatchInlineSnapshot(`
    {
      "en": [],
      "nb": [],
      "nn": [],
      "se": [
        "myNdla.learningpath.sharing.title",
        "archivedPage",
      ],
    }
  `);
});
