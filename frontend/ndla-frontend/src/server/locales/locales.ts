/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveUntranslated } from "@ndla/locales";
import type { i18n } from "i18next";
import config from "../../config";
import { preferredLanguages } from "../../i18n";
import { i18nInstanceWithTranslations } from "../../i18nInstanceWithTranslations";

export const initializeI18n = (language: string): i18n =>
  i18nInstanceWithTranslations.cloneInstance({
    lng: language,
    supportedLngs: preferredLanguages,
  }) as i18n;

const canonicalBundle = i18nInstanceWithTranslations.getResourceBundle(config.defaultLocale, "translation");

const stringifyLanguage = (language: string) =>
  JSON.stringify(
    resolveUntranslated(i18nInstanceWithTranslations.getResourceBundle(language, "translation"), canonicalBundle),
  );

export const stringifiedLanguages = {
  en: stringifyLanguage("en"),
  nn: stringifyLanguage("nn"),
  nb: stringifyLanguage("nb"),
  se: stringifyLanguage("se"),
} as const;
