/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useContext } from "react";
// oxlint-disable no-restricted-imports
import {
  Navigate,
  useHref,
  useLocation,
  useNavigate,
  type NavigateOptions,
  type NavigateProps,
  type To,
} from "react-router";
// oxlint-enable no-restricted-imports
import { LinkPathContext, type LinkPathResolver } from "./LinkPathContext";

const ROOT_PATH_REGEXP = /^\/(?=[?#]|$)/;

/**
 * Creates the path helpers that depend on which locales an app supports as a path prefix (e.g., `/nn`)
 */
export const createLocalePathHelpers = (locales: readonly string[]) => {
  const localePrefixRegexp = new RegExp(`^/(${locales.join("|")})(?=[/?#]|$)`);

  /**
   * Returns a resolver that prepends the locale to the path if it does not already contain a locale
   */
  const createLocalePathResolver = (locale: string): LinkPathResolver => {
    if (!locale) return (to) => to;

    const localePrefix = `/${locale}`;

    return (to) => {
      if (localePrefixRegexp.test(to)) return to;
      return ROOT_PATH_REGEXP.test(to) ? `${localePrefix}${to.slice(1)}` : `${localePrefix}${to}`;
    };
  };

  /**
   * `useLocation().pathname` without the locale prefix
   */
  const useBasePathname = (): string => {
    const { pathname } = useLocation();
    return pathname.replace(localePrefixRegexp, "") || "/";
  };

  return { createLocalePathResolver, useBasePathname };
};

export const useLocalePath = (): LinkPathResolver => useContext(LinkPathContext);

const resolveTo = (resolve: LinkPathResolver, to: To): To => {
  if (typeof to === "string") return to.startsWith("/") ? resolve(to) : to;
  if (to.pathname?.startsWith("/")) return { ...to, pathname: resolve(to.pathname) };
  return to;
};

/** `useHref()` with the locale prefix prepended  */
export const useLocaleHref = (to: To): string => {
  const resolve = useLocalePath();
  return useHref(resolveTo(resolve, to));
};

/** Alias for `useLocation()`, to indicate intent behind using the raw location without any locale logic */
export const useRawLocation = useLocation;

/** `useNavigate()` with the locale prefix prepended */
export const useLocaleNavigate = () => {
  const navigate = useNavigate();
  const resolve = useLocalePath();

  return useCallback(
    (to: To | number, options?: NavigateOptions) =>
      typeof to === "number" ? navigate(to) : navigate(resolveTo(resolve, to), options),
    [navigate, resolve],
  );
};

/** `<Navigate />` with the locale prefix prepended */
export const LocaleNavigate = ({ to, ...rest }: NavigateProps) => {
  const resolve = useLocalePath();
  return <Navigate to={resolveTo(resolve, to)} {...rest} />;
};
