/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createLocalePathHelpers } from "@ndla/safelink";
import { supportedLanguages } from "../i18n";

export const { createLocalePathResolver, useBasePathname } = createLocalePathHelpers(supportedLanguages);

export { LocaleNavigate, useLocaleHref, useLocaleNavigate, useLocalePath, useRawLocation } from "@ndla/safelink";
