/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { articleTraitValues } from "@ndla/types-backend/search-api";
import { translationHelper } from "./i18nTestInstance";

describe("all traits should have a translation", () => {
  translationHelper(Object.values(articleTraitValues).map((key) => `articleTraits.${key}`));
});
