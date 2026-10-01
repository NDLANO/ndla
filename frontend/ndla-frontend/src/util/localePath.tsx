/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LinkPathContext, type LinkPathResolver } from "@ndla/safelink";
import { useCallback, useContext } from "react";
import {
  Navigate,
  useHref,
  useLocation,
  useNavigate,
  type NavigateOptions,
  type NavigateProps,
  type To,
} from "react-router";
import { getLocaleInfoFromPath, supportedLanguages } from "../i18n";
import type { PathLocale } from "../interfaces";

const LOCALE_PREFIX_REGEXP = new RegExp(`^/(${supportedLanguages.join("|")})(?=[/?#]|$)`);
const ROOT_PATH_REGEXP = /^\/(?=[?#]|$)/;

export const hasLocalePrefix = (path: string): boolean => LOCALE_PREFIX_REGEXP.test(path);

/**
 * Returns a resolver that prepends the locale to the path (e.g., `/nn`) if it does not already contain a locale
 */
export const createLocalePathResolver = (locale: PathLocale): LinkPathResolver => {
  if (!locale) return (to) => to;

  const localePrefix = `/${locale}`;

  return (to) => {
    if (hasLocalePrefix(to)) return to;
    return ROOT_PATH_REGEXP.test(to) ? `${localePrefix}${to.slice(1)}` : `${localePrefix}${to}`;
  };
};

export const useLocalePath = (): LinkPathResolver => useContext(LinkPathContext);

/**
 * `useLocation().pathname` without the locale prefix (e.g., `/nn`)
 */
export const useBasePathname = (): string => {
  const { pathname } = useLocation();
  return getLocaleInfoFromPath(pathname).basepath;
};

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
