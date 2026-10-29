/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import translationsNB from "../translations-nb";
import type { MergeTranslations } from "../types";

// `MergeTranslations` is a plain intersection, which is only a correct model of i18next's runtime
// deep-merge while every leaf is typed `string`. An `as const` on a translation store would give
// leaves literal types, and `L[K] & R[K]` would then collapse to `never` for any key an app
// overrides with a different value — silently dropping it from `ParseKeys`. tsc is the guard: the
// assignment below stops compiling the moment a leaf stops being a widened `string`.
type Merged = MergeTranslations<typeof translationsNB, { article: { appOnly: string } }>;

test("leaves stay widened and an app key survives the merge", () => {
  const merged: Pick<Merged["article"], "lastUpdated" | "appOnly"> = {
    lastUpdated: "any string is assignable" as string,
    appOnly: "" as string,
  };
  expect(typeof merged.lastUpdated).toBe("string");
});
