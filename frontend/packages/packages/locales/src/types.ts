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
 * guards against that; `MergeMessagesDeep` is the replacement if the guard ever has to go.
 */
export type MergeMessages<Shared, App> = Shared & App;

/** Right-biased structural merge. Unused, kept as the standby for `MergeMessages`. */
export type MergeMessagesDeep<L, R> = {
  [K in keyof L | keyof R]: K extends keyof R
    ? K extends keyof L
      ? L[K] extends object
        ? R[K] extends object
          ? MergeMessagesDeep<L[K], R[K]>
          : R[K]
        : R[K]
      : R[K]
    : K extends keyof L
      ? L[K]
      : never;
};
