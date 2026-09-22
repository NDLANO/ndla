/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext } from "react";

export type LinkPathResolver = (to: string) => string;

/**
 * A context for resolving link paths based on the current locale. The default value keeps the path as is.
 */
export const LinkPathContext = createContext<LinkPathResolver>((to) => to);
