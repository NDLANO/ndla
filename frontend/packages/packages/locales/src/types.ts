/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type messagesNB from "./messages-nb";

/** Canonical shape of the shared message store. nb is the source of truth. */
export type Messages = typeof messagesNB;

/**
 * The effective key space after i18next deep-merges an app's messages over the shared ones.
 *
 * A plain intersection is only correct because every leaf is typed `string` — no message store
 * uses `as const`. If a leaf ever gained a literal type, `L[K] & R[K]` would collapse to `never`
 * for differing values and the key would silently vanish from `ParseKeys`. `message-shape-test`
 * guards against that.
 */
export type MergeMessages<Shared, App> = Shared & App;

/** Keys of `T` whose value is a message rather than a nested group. */
export type LeafKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];

/** `"searchNoHits" | …` -> `"search" | …`, for key families named by a shared suffix. */
export type StripSuffix<T, S extends string> = T extends `${infer Base}${S}` ? Base : never;
