/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { prerenderStatic } from "@apollo/client/react/ssr";
import type { Request } from "express";
import { prerenderToNodeStream } from "react-dom/static";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router";
import { AppShell } from "../../AppShell";
import type { RedirectInfo } from "../../components/RedirectContext";
import config from "../../config";
import { Document } from "../../Document";
import type { NdlaRouteObject, PathLocale, SiteTheme } from "../../interfaces";
import { MOVED_PERMANENTLY, OK } from "../../statusCodes";
import { createApolloClient } from "../../util/apiHelpers";
import { getLazyLoadedChunks } from "../getManifestChunks";
import { isRestrictedMode } from "../helpers/restrictedMode";
import { initializeI18n, stringifiedLanguages } from "../locales/locales";
import { createFetchRequest } from "../request";
import type { RenderReturn, RouteChunkInfoWithManifest } from "../serverHelpers";
import { disableSSR, prerenderToString } from "./renderHelpers";

interface RenderPageOptions {
  req: Request;
  routes: NdlaRouteObject[];
  chunkInfo: RouteChunkInfoWithManifest;
  locale: PathLocale;
  versionHash?: string;
  siteTheme?: SiteTheme;
  missingRouter?: boolean;
  data?: Record<string, any>;
  useAuthenticationContext?: boolean;
}

export const renderPage = async ({
  req,
  routes,
  chunkInfo,
  locale,
  versionHash,
  siteTheme,
  missingRouter,
  data,
  useAuthenticationContext,
}: RenderPageOptions): Promise<RenderReturn> => {
  const lazyChunkInfo = getLazyLoadedChunks(routes, req.path, chunkInfo);
  const localeOrDefault = locale ? locale : config.defaultLocale;
  const translations = stringifiedLanguages[localeOrDefault];
  const restrictedMode = isRestrictedMode(req);
  const noSSR = disableSSR(req);

  const windowData = {
    ...data,
    chunkInfo: lazyChunkInfo,
    translations,
    restrictedMode,
    siteTheme,
    config: { ...config, disableSSR: noSSR },
  };

  if (noSSR) {
    return {
      status: OK,
      locale: localeOrDefault,
      data: {
        htmlContent: await prerenderToString(<Document language={localeOrDefault} chunkInfo={lazyChunkInfo} />),
        data: windowData,
      },
    };
  }

  const client = createApolloClient(localeOrDefault, versionHash);
  const i18n = initializeI18n(localeOrDefault);
  const redirect: RedirectInfo = {};

  const staticHandler = createStaticHandler(routes);
  const context = await staticHandler.query(createFetchRequest(req));

  if (context instanceof Response) {
    throw context;
  }

  const router = createStaticRouter(staticHandler.dataRoutes, context);

  const page = (
    <AppShell
      language={locale}
      chunkInfo={lazyChunkInfo}
      i18n={i18n}
      client={client}
      restrictedMode={restrictedMode}
      siteTheme={siteTheme}
      versionHash={versionHash}
      redirect={redirect}
      missingRouter={missingRouter}
      useAuthenticationContext={useAuthenticationContext}
    >
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </AppShell>
  );

  const result = await prerenderStatic({
    tree: page,
    renderFunction: prerenderToNodeStream,
  });

  if (redirect.url) {
    return {
      status: redirect.status || MOVED_PERMANENTLY,
      location: redirect.url,
    };
  }

  return {
    status: redirect.status ?? OK,
    locale: localeOrDefault,
    data: {
      htmlContent: result.result,
      data: {
        ...windowData,
        apolloState: client.extract(),
        serverResponse: redirect.status ?? undefined,
      },
    },
  };
};
