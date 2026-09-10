/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getUntranslatedKeys } from "@ndla/util";
import messagesEN from "../messages-en";
import messagesNB from "../messages-nb";
import messagesNN from "../messages-nn";
import messagesSE from "../messages-se";

test("nb, the fallback source, is fully translated", () => {
  expect(getUntranslatedKeys(messagesNB)).toEqual([]);
});

test("keys still awaiting translation", () => {
  expect({
    nn: getUntranslatedKeys(messagesNN),
    en: getUntranslatedKeys(messagesEN),
    se: getUntranslatedKeys(messagesSE),
  }).toMatchInlineSnapshot(`
    {
      "en": [],
      "nn": [],
      "se": [],
    }
  `);
});
