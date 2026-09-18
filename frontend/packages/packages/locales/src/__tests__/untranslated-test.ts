/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import i18next from "i18next";
import { untranslated } from "../untranslated";

const nb = { close: "Lukk", article: { lastUpdated: "Sist oppdatert" } };
const se = { close: untranslated, article: { lastUpdated: untranslated } };

const instance = i18next.createInstance();
await instance.init({
  lng: "se",
  fallbackLng: "nb",
  supportedLngs: ["nb", "se"],
  resources: { nb: { translation: nb }, se: { translation: se } },
});

test("untranslated keys fall back to the canonical language", () => {
  expect(instance.t("close")).toBe(nb.close);
  expect(instance.t("article.lastUpdated")).toBe(nb.article.lastUpdated);
});
