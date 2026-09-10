/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { wordClassValues } from "@ndla/types-backend/concept-api";
import { translationHelper } from "./i18nTestInstance";

describe("all word classes should have a translation", () => {
  translationHelper(Object.values(wordClassValues).map((key) => `wordClass.${key}`));
});
