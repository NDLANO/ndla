/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "../config";
import { getHtmlLang, getLocaleInfoFromPath } from "../i18n";
import type { LocaleType, PathLocale } from "../interfaces";

export type AppType = "default" | "iframe" | "lti";

interface AppPathInfo {
  appType: AppType;
  /** The locale prefix that links are resolved against. Empty when links should not be prefixed. */
  pathLocale: PathLocale;
  /** The locale used for translations and API requests. */
  locale: LocaleType;
}

/** Tells which part of the app a path belongs to, and which locale it renders in. */
export const getAppPathInfo = (pathname: string): AppPathInfo => {
  const [, first, second] = pathname.split("/");
  if (first === "article-iframe" || first === "embed-iframe") {
    const locale = getHtmlLang(second);
    return { appType: "iframe", pathLocale: locale, locale };
  }
  if (first === "lti") {
    return { appType: "lti", pathLocale: "", locale: config.defaultLocale };
  }
  const { basename, abbreviation } = getLocaleInfoFromPath(pathname);
  return { appType: "default", pathLocale: basename, locale: abbreviation };
};
