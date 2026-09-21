/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { contributorTypeValues } from "@ndla/types-backend/article-api";
import { translationHelper } from "./i18nTestInstance";

describe("all contributors should have a translation", () => {
  translationHelper(Object.values(contributorTypeValues).map((key) => `${key}`));
});
