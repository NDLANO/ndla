/**
 * Copyright (c) 2018-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createInstance, type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import config from "./config";
import type { LocaleType } from "./interfaces";

export const supportedLanguages: LocaleType[] = ["nb", "nn", "en", "se"];
export const preferredLanguages: LocaleType[] = ["nb", "nn"];
export const myndlaLanguages: LocaleType[] = ["nb", "nn", "en"];

export const isValidLocale = (localeAbbreviation: string | undefined | null): localeAbbreviation is LocaleType =>
  !!localeAbbreviation && supportedLanguages.includes(localeAbbreviation as LocaleType);

export const getHtmlLang = (localeAbbreviation?: string): LocaleType => {
  const locale = supportedLanguages.find((l) => l === localeAbbreviation);
  return locale ?? (config.defaultLocale as LocaleType);
};

export const getLocaleInfoFromPath = (path: string) => {
  const paths = path.split("/");
  const basename = paths[1] && isValidLocale(paths[1]) ? paths[1] : "";
  const basepath = basename ? path.replace(`/${basename}`, "") : path;
  return {
    basepath: basepath.length === 0 ? "/" : basepath,
    basename,
    abbreviation: getHtmlLang(basename),
  } as const;
};

export const initializeI18n = (locale: string, translations: string): i18n => {
  const i18nInstance = createInstance({
    lng: locale,
    fallbackLng: config.defaultLocale,
    supportedLngs: supportedLanguages,
    resources: { [locale]: { translation: JSON.parse(translations) } },
  }).use(initReactI18next);
  i18nInstance.init();
  return i18nInstance as i18n;
};
