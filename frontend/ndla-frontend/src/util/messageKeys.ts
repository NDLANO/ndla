/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MergeMessages, Messages as SharedMessages } from "@ndla/locales";
import type messagesNB from "../messages/messagesNB";

/** The merged key space, mirroring the i18next resource bundle this app builds at runtime. */
export type AppMessages = MergeMessages<SharedMessages, typeof messagesNB>;

/** Keys of `T` whose value is a message rather than a nested group. */
type LeafKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];

/** Backend contracts type these as open strings; we only ship copy for the members below. */
export type UserRole = LeafKeys<AppMessages["user"]["role"]>;
export type ContentTypeKey = LeafKeys<AppMessages["contentTypes"]>;
export type EmbedTypeKey = LeafKeys<AppMessages["embed"]["type"]>;
