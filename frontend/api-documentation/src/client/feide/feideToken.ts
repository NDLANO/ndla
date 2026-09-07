/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FEIDE_ID_TOKEN_COOKIE, getCookie } from "@ndla/util";

export const isExpired = (token: string): boolean => {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return true;
    const payload: unknown = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
    const exp = (payload as { exp?: unknown }).exp;
    return typeof exp !== "number" || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const feideToken = (): string | undefined => {
  const cookie = getCookie(FEIDE_ID_TOKEN_COOKIE, document.cookie);
  if (cookie && !isExpired(cookie)) return cookie;
  return undefined;
};
