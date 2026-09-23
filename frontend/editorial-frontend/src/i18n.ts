/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SUPPORTED_LANGUAGES } from "./constants";
import { i18nInstanceWithTranslations } from "./i18nInstanceWithTranslations";
import type { LocaleType } from "./interfaces";
import en from "./translations/translations-en";
import nb from "./translations/translations-nb";
import nn from "./translations/translations-nn";

export const subjectLanguages: LocaleType[] = ["nb", "nn", "en", "se", "sma"];
export const collectionLanguages: LocaleType[] = ["nb", "nn", "en", "se", "sma", "ukr"];

export const isValidLocale = (localeAbbreviation: string | undefined): localeAbbreviation is LocaleType => {
  return SUPPORTED_LANGUAGES.includes(localeAbbreviation as LocaleType);
};

export const initializeI18n = (language: string) => {
  const instance = i18nInstanceWithTranslations.cloneInstance({
    lng: language,
    supportedLngs: SUPPORTED_LANGUAGES,
  });
  instance.addResourceBundle("en", "translation", en, true, true);
  instance.addResourceBundle("nb", "translation", nb, true, true);
  instance.addResourceBundle("nn", "translation", nn, true, true);
  document.documentElement.lang = language;
  return instance;
};
