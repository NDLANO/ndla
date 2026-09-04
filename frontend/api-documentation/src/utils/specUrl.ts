/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const LOCALHOST_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

interface SpecUrlOptions {
  apiDomain: string;
  allowLocalhost: boolean;
}

function safeParseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

export const isAllowedSpecUrl = (url: string, { apiDomain, allowLocalhost }: SpecUrlOptions): boolean => {
  const parsed = safeParseUrl(url);
  if (!parsed) return false;
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (parsed.origin === new URL(apiDomain).origin) return true;

  return allowLocalhost && LOCALHOST_HOSTNAMES.includes(parsed.hostname);
};
