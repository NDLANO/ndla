/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { routes } from "../../appRoutes";
import { getLocaleInfoFromPath } from "../../i18n";
import { withLocalePrefixes } from "../../localeRoutes";
import { getSiteTheme } from "../../util/siteTheme";
import type { RenderFunc } from "../serverHelpers";
import { renderPage } from "./renderPage";

const localeRoutes = withLocalePrefixes(routes);

export const defaultRender: RenderFunc = async (req, chunkInfo) => {
  const { basename } = getLocaleInfoFromPath(req.originalUrl);

  return renderPage({
    req,
    routes: localeRoutes,
    chunkInfo,
    locale: basename,
    versionHash: typeof req.query.versionHash === "string" ? req.query.versionHash : undefined,
    siteTheme: getSiteTheme(),
    data: {
      serverPath: req.path,
      serverQuery: req.query,
    },
    useAuthenticationContext: true,
  });
};
