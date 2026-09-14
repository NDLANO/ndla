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

export const stringifiedLanguages = {
  en: JSON.stringify(i18nInstanceWithTranslations.getResourceBundle("en", "translation")),
  nn: JSON.stringify(i18nInstanceWithTranslations.getResourceBundle("nn", "translation")),
  nb: JSON.stringify(i18nInstanceWithTranslations.getResourceBundle("nb", "translation")),
  se: JSON.stringify(i18nInstanceWithTranslations.getResourceBundle("se", "translation")),
} as const;
