/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { messagesEN, messagesNB, messagesNN, messagesSE } from "@ndla/locales";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import config from "./config";
import en from "./messages/messagesEN";
import nb from "./messages/messagesNB";
import nn from "./messages/messagesNN";
import se from "./messages/messagesSE";
import { supportedLanguages } from "./util/supportedLanguages";

// for some stupid reason, this needs to be in its own file. initReacti18next struggles to bind
// to the actual instance if we do it in other ways.

const i18nInstanceWithTranslations = createInstance().use(initReactI18next);

i18nInstanceWithTranslations.init({
  fallbackLng: config.defaultLocale,
  supportedLngs: supportedLanguages,
  resources: {
    en: {
      translation: messagesEN,
    },
    nn: {
      translation: messagesNN,
    },
    nb: {
      translation: messagesNB,
    },
    se: {
      translation: messagesSE,
    },
  },
});

const translatedLanguages = { en, nb, nn, se } as const;

Object.entries(translatedLanguages).forEach(([language, messages]) =>
  i18nInstanceWithTranslations.addResourceBundle(language, "translation", messages, true, true),
);

// Use the fallback language to fill in missing translations for other languages
const fallbackLanguage = Object.keys(translatedLanguages).find((language) => language === config.defaultLocale);
if (fallbackLanguage) {
  const fallbackBundle = i18nInstanceWithTranslations.getResourceBundle(fallbackLanguage, "translation");
  Object.keys(translatedLanguages)
    .filter((language) => language !== fallbackLanguage)
    .forEach((language) =>
      i18nInstanceWithTranslations.addResourceBundle(language, "translation", fallbackBundle, true, false),
    );
}

export { i18nInstanceWithTranslations };
