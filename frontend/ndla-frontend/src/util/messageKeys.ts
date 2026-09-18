/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LeafKeys } from "@ndla/locales";
import type { CustomTypeOptions } from "i18next";

/** The merged key space, as declared for i18next in `types/i18next.d.ts`. */
type AppMessages = CustomTypeOptions["resources"]["translation"];

/** Backend contracts type these as open strings; we only ship copy for the members below. */
export type UserRole = LeafKeys<AppMessages["user"]["role"]>;
export type ContentTypeKey = LeafKeys<AppMessages["contentTypes"]>;
export type EmbedTypeKey = LeafKeys<AppMessages["embed"]["type"]>;
