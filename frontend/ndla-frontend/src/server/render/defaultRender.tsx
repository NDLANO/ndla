/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { routes } from "../../appRoutes";
import config from "../../config";
import { getLocaleInfoFromPath, isValidLocale } from "../../i18n";
import type { LocaleType } from "../../interfaces";
import { TEMPORARY_REDIRECT } from "../../statusCodes";
import { getSiteTheme } from "../../util/siteTheme";
import type { RenderFunc } from "../serverHelpers";
import { renderPage } from "./renderPage";

export const defaultRender: RenderFunc = async (req, chunkInfo) => {
  const { basename, basepath, abbreviation } = getLocaleInfoFromPath(req.originalUrl);
  const locale = isValidLocale(abbreviation) ? abbreviation : (config.defaultLocale as LocaleType);
  if ((basename === "" && locale !== "nb") || (basename && basename !== locale)) {
    return {
      status: TEMPORARY_REDIRECT,
      location: `/${locale}${basepath}`,
    };
  }

  return renderPage({
    req,
    routes,
    chunkInfo,
    locale,
    basename: basename?.length ? `/${basename}` : undefined,
    versionHash: typeof req.query.versionHash === "string" ? req.query.versionHash : undefined,
    siteTheme: getSiteTheme(),
    data: {
      serverPath: req.path,
      serverQuery: req.query,
    },
    useAuthenticationContext: true,
  });
};
