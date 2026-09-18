/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getUntranslatedKeys } from "@ndla/util";
import se from "../../../messages/messagesSE";
import { stringifiedLanguages } from "../locales";

// The client instance loads a single language over `/locales/:lang` and has no fallback bundle, so
// anything still `untranslated` in the store has to be resolved before the bundle is served.
const at = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], obj);

describe("served locale bundles", () => {
  it("serves the canonical copy for keys awaiting translation", () => {
    const servedSE = JSON.parse(stringifiedLanguages.se);
    const servedNB = JSON.parse(stringifiedLanguages.nb);
    const untranslated = getUntranslatedKeys(se);

    expect(untranslated.length).toBeGreaterThan(0);
    untranslated.forEach((path) => {
      expect(at(servedSE, path)).toBe(at(servedNB, path));
    });
  });
});
