/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import messagesNB from "../messages-nb";
import type { MergeMessages } from "../types";

// `MergeMessages` is a plain intersection, which is only a correct model of i18next's runtime
// deep-merge while every leaf is typed `string`. An `as const` on a message store would give
// leaves literal types, and `L[K] & R[K]` would then collapse to `never` for any key an app
// overrides with a different value — silently dropping it from `ParseKeys`.
type Leaf = (typeof messagesNB)["article"]["lastUpdated"];
const _leafIsWidened: Leaf = "any string is assignable" as string;

type Merged = MergeMessages<typeof messagesNB, { article: { appOnly: string } }>;
const _mergeKeepsShared: Merged["article"]["lastUpdated"] = "";
const _mergeKeepsApp: Merged["article"]["appOnly"] = "";

test("message stores keep widened string leaves", () => {
  expect(typeof _leafIsWidened).toBe("string");
  expect(typeof _mergeKeepsShared).toBe("string");
  expect(typeof _mergeKeepsApp).toBe("string");
});
