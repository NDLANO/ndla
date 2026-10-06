/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "./config";
import { SUPPORTED_LANGUAGES } from "./constants";
import { i18nInstanceWithTranslations } from "./i18nInstanceWithTranslations";
import type { LocaleType, PathLocale, UiLocale } from "./interfaces";
import en from "./translations/translations-en";
import nb from "./translations/translations-nb";
import nn from "./translations/translations-nn";

export const subjectLanguages: LocaleType[] = ["nb", "nn", "en", "se", "sma"];
export const collectionLanguages: LocaleType[] = ["nb", "nn", "en", "se", "sma", "ukr"];

export const isValidLocale = (localeAbbreviation: string | undefined): localeAbbreviation is UiLocale => {
  return SUPPORTED_LANGUAGES.includes(localeAbbreviation as LocaleType);
};

export const getLocaleInfoFromPath = (path: string) => {
  const paths = path.split("/");
  const basename: PathLocale = isValidLocale(paths[1]) ? paths[1] : "";
  const basepath = basename ? path.replace(`/${basename}`, "") : path;
  return {
    basepath: basepath.length === 0 ? "/" : basepath,
    basename,
    abbreviation: basename || config.defaultLanguage,
  } as const;
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
