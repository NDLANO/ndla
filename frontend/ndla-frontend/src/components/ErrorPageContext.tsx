/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ErrorLike } from "@apollo/client";
import { createContext } from "react";

export type ErrorPageKind = "gone" | "accessDenied" | "notFound" | "internal";

export interface ErrorPageInfo {
  error: ErrorLike;
  kind: ErrorPageKind;
}

export type SetErrorPageInfo = (info: ErrorPageInfo) => void;

export const ErrorPageContext = createContext<SetErrorPageInfo | undefined>(undefined);
