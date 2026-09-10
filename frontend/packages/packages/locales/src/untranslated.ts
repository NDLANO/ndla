/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * A key that exists but has no copy in this language yet. i18next resolves `undefined` by walking
 * the fallback chain, so the nb text renders. Typed as `string` so `satisfies typeof canonical`
 * still fails on a key that was merely forgotten, and so message leaves stay widened.
 */
export const untranslated = undefined as unknown as string;

/**
 * Fill `untranslated` (and outright missing) leaves from the canonical bundle. Needed wherever a
 * single-language bundle is shipped without its fallback alongside it — see ndla-frontend's
 * per-language `/locales` route, whose client instance has nothing to fall back to.
 */
export const resolveUntranslated = <T extends object>(bundle: object, canonical: T): T => {
  const resolved: Record<string, unknown> = { ...bundle };
  Object.entries(canonical).forEach(([key, canonicalValue]: [string, unknown]) => {
    const value = (bundle as Record<string, unknown>)[key];
    if (typeof canonicalValue === "object" && canonicalValue !== null) {
      resolved[key] = resolveUntranslated(typeof value === "object" && value !== null ? value : {}, canonicalValue);
    } else {
      resolved[key] = value ?? canonicalValue;
    }
  });
  return resolved as T;
};
