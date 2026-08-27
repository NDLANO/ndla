/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { renderToString } from "react-dom/server";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router";
import { errorRoutes } from "../../appRoutes";
import { AppShell } from "../../AppShell";
import config from "../../config";
import { getHtmlLang, getLocaleInfoFromPath } from "../../i18n";
import { OK } from "../../statusCodes";
import { getSiteTheme } from "../../util/siteTheme";
import { isRestrictedMode } from "../helpers/restrictedMode";
import { initializeI18n, stringifiedLanguages } from "../locales/locales";
import { createFetchRequest } from "../request";
import type { RenderFunc } from "../serverHelpers";

const { query, dataRoutes } = createStaticHandler(errorRoutes);

export const errorRender: RenderFunc = async (req, { manifest: _, ...chunkInfo }) => {
  const lang = getHtmlLang(typeof req.params.lang === "string" ? req.params.lang : undefined);
  const siteTheme = getSiteTheme();
  const { abbreviation } = getLocaleInfoFromPath(req.path ?? "");
  const i18n = initializeI18n(abbreviation);
  const hash = stringifiedLanguages[lang].hash;
  const restrictedMode = isRestrictedMode(req);

  const context = await query(createFetchRequest(req));

  if (context instanceof Response) {
    throw context;
  }

  const router = createStaticRouter(dataRoutes, context);

  const htmlContent = renderToString(
    <AppShell
      language={lang}
      hash={hash}
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
    status: OK,
    locale: lang,
    data: {
      htmlContent,
      data: {
        chunkInfo,
        siteTheme,
        serverPath: req.path,
        serverQuery: req.query,
        config,
        hash,
        restrictedMode,
      },
    },
  };
};
