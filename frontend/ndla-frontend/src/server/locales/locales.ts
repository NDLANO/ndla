/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { i18n } from "i18next";
import { preferredLanguages } from "../../i18n";
import { i18nInstanceWithTranslations } from "../../i18nInstanceWithTranslations";

export const initializeI18n = (language: string): i18n =>
  i18nInstanceWithTranslations.cloneInstance({
    lng: language,
    supportedLngs: preferredLanguages,
  }) as i18n;

const stringifyLanguage = (language: string) => {
  const bundle = i18nInstanceWithTranslations.getResourceBundle(language, "translation");
  return JSON.stringify(bundle);
};

export const stringifiedLanguages = {
  en: stringifyLanguage("en"),
  nn: stringifyLanguage("nn"),
  nb: stringifyLanguage("nb"),
  se: stringifyLanguage("se"),
} as const;
