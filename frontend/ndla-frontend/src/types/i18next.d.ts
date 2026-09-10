/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MergeMessages, Messages as SharedMessages } from "@ndla/locales";
import type { i18n as originalI18n } from "i18next";
import type { LocaleType } from "../interfaces";
import type messagesNB from "../messages/messagesNB";

declare module "i18next" {
  export interface i18n extends Omit<originalI18n, "language"> {
    language: LocaleType;
  }

  // Mirrors the runtime deep-merge of the shared bundle and this app's own messages.
  interface CustomTypeOptions {
    defaultNS: "translation";
    parseInterpolation: false;
    resources: {
      translation: MergeMessages<SharedMessages, typeof messagesNB>;
    };
  }
}
