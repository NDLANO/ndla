/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router";
import { errorRoutes } from "../../appRoutes";
import { AppShell } from "../../AppShell";
import config from "../../config";
import { getHtmlLang, getLocaleInfoFromPath } from "../../i18n";
import { INTERNAL_SERVER_ERROR } from "../../statusCodes";
import { getSiteTheme } from "../../util/siteTheme";
import { isRestrictedMode } from "../helpers/restrictedMode";
import { initializeI18n, stringifiedLanguages } from "../locales/locales";
import { createFetchRequest } from "../request";
import type { RenderFunc } from "../serverHelpers";
import { prerenderToString } from "./renderHelpers";

const staticHandler = createStaticHandler(errorRoutes);

export const errorRender: RenderFunc = async (req, { manifest: _, ...chunkInfo }) => {
  const lang = getHtmlLang(typeof req.params.lang === "string" ? req.params.lang : undefined);
  const siteTheme = getSiteTheme();
  const { abbreviation } = getLocaleInfoFromPath(req.path ?? "");
  const i18n = initializeI18n(abbreviation);
  const translations = stringifiedLanguages[abbreviation];
  const restrictedMode = isRestrictedMode(req);

  const context = await staticHandler.query(createFetchRequest(req));

  if (context instanceof Response) {
    throw context;
  }

  const router = createStaticRouter(staticHandler.dataRoutes, context);

  const htmlContent = await prerenderToString(
    <AppShell
      language={lang}
      chunkInfo={chunkInfo}
      i18n={i18n}
      restrictedMode={restrictedMode}
      siteTheme={siteTheme}
      missingRouter
    >
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </AppShell>,
  );

  return {
    status: INTERNAL_SERVER_ERROR,
    locale: lang,
    data: {
      htmlContent,
      data: {
        chunkInfo,
        siteTheme,
        serverPath: req.path,
        serverQuery: req.query,
        config,
        translations,
        restrictedMode,
      },
    },
  };
};
