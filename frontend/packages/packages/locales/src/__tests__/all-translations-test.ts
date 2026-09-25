/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getUntranslatedKeys, validateTranslationFiles } from "@ndla/util";
import translationsEN from "../translations-en";
import translationsNB from "../translations-nb";
import translationsNN from "../translations-nn";
import translationsSE from "../translations-se";

test("That all translations has all language keys", () => {
  const anyMissing = validateTranslationFiles(
    [
      { languageName: "Norsk bokmål", translationObject: translationsNB },
      { languageName: "Norsk nynorsk", translationObject: translationsNN },
      { languageName: "English", translationObject: translationsEN },
      { languageName: "Nordsamisk", translationObject: translationsSE },
    ],
    "only-on-error",
  );

  expect(anyMissing).toBe(false);
});

test("keys still awaiting translation", () => {
  expect({
    nb: getUntranslatedKeys(translationsNB),
    nn: getUntranslatedKeys(translationsNN),
    en: getUntranslatedKeys(translationsEN),
    se: getUntranslatedKeys(translationsSE),
  }).toMatchInlineSnapshot(`
    {
      "en": [],
      "nb": [],
      "nn": [],
      "se": [
        "languages.ar",
        "languages.la",
        "languages.no",
        "languages.so",
        "languages.ti",
        "languages.und",
        "languages.prs",
        "languages.san",
        "languages.heb",
        "languages.pli",
      ],
    }
  `);
});
