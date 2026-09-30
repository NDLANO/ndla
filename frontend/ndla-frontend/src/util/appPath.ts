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
import { unreachable } from "./guards";

export type AppType = "default" | "iframe" | "lti";

interface AppPathInfo {
  appType: AppType;
  /** The locale prefix that links are resolved against. Empty when links should not be prefixed. */
  pathLocale: PathLocale;
  /** The locale used for translations and API requests. */
  locale: LocaleType;
}

const getAppType = (firstPathSegment: string | undefined): AppType => {
  switch (firstPathSegment) {
    case "article-iframe":
    case "embed-iframe":
      return "iframe";
    case "lti":
      return "lti";
    default:
      return "default";
  }
};

/** Tells which part of the app a path belongs to, and which locale it renders in. */
export const getAppPathInfo = (pathname: string): AppPathInfo => {
  const [, first, second] = pathname.split("/");
  const appType = getAppType(first);
  switch (appType) {
    case "iframe": {
      const locale = getHtmlLang(second);
      return { appType, pathLocale: locale, locale };
    }
    case "lti": {
      return { appType, pathLocale: "", locale: config.defaultLocale };
    }
    case "default": {
      const { basename, abbreviation } = getLocaleInfoFromPath(pathname);
      return { appType, pathLocale: basename, locale: abbreviation };
    }
    default:
      return unreachable(appType);
  }
};
