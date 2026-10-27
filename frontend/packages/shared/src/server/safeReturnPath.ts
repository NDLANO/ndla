/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SENTINEL_ORIGIN = "http://ndla.invalid";

export const safeReturnPath = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(raw, SENTINEL_ORIGIN);
  } catch {
    return undefined;
  }

  if (parsed.origin !== SENTINEL_ORIGIN) return undefined;

  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (!path.startsWith("/") || path.startsWith("//")) return undefined;
  return path;
};
