/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MergeTranslations, Translations as SharedTranslations } from "@ndla/locales";
import type { i18n as originalI18n } from "i18next";
import type { LocaleType } from "../interfaces";
import type translationsNB from "../translations/translations-nb";

declare module "i18next" {
  export interface i18n extends Omit<originalI18n, "language"> {
    language: LocaleType;
  }

  interface CustomTypeOptions {
    defaultNS: "translation";
    parseInterpolation: false;
    resources: { translation: MergeTranslations<SharedTranslations, typeof translationsNB> };
  }
}
