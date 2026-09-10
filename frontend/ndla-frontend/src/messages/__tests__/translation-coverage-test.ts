/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getUntranslatedKeys } from "@ndla/util";
import en from "../messagesEN";
import nb from "../messagesNB";
import nn from "../messagesNN";
import se from "../messagesSE";

test("nb, the fallback source, is fully translated", () => {
  expect(getUntranslatedKeys(nb)).toEqual([]);
});

test("keys still awaiting translation", () => {
  expect({
    nn: getUntranslatedKeys(nn),
    en: getUntranslatedKeys(en),
    se: getUntranslatedKeys(se),
  }).toMatchInlineSnapshot(`
    {
      "en": [],
      "nn": [],
      "se": [
        "myNdla.learningpath.sharing.title",
        "archivedPage",
      ],
    }
  `);
});
