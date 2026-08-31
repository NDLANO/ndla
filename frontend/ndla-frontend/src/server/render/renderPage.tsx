/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { prerenderStatic } from "@apollo/client/react/ssr";
import type { Request } from "express";
import { renderToString } from "react-dom/server";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router";
import { AppShell } from "../../AppShell";
import type { RedirectInfo } from "../../components/RedirectContext";
import config from "../../config";
import { Document } from "../../Document";
import type { LocaleType, NdlaRouteObject, SiteTheme } from "../../interfaces";
import { MOVED_PERMANENTLY, OK } from "../../statusCodes";
import { createApolloClient } from "../../util/apiHelpers";
import { getLazyLoadedChunks } from "../getManifestChunks";
import { isRestrictedMode } from "../helpers/restrictedMode";
import { initializeI18n, stringifiedLanguages } from "../locales/locales";
import { createFetchRequest } from "../request";
import type { RenderReturn, RouteChunkInfoWithManifest } from "../serverHelpers";
import { disableSSR } from "./renderHelpers";

interface RenderPageOptions {
  req: Request;
  routes: NdlaRouteObject[];
  chunkInfo: RouteChunkInfoWithManifest;
  locale: LocaleType;
  basename?: string;
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
  basename,
  versionHash,
  siteTheme,
  missingRouter,
  data,
  useAuthenticationContext,
}: RenderPageOptions): Promise<RenderReturn> => {
  const lazyChunkInfo = getLazyLoadedChunks(routes, req.path, chunkInfo);
  const hash = stringifiedLanguages[locale].hash;
  const restrictedMode = isRestrictedMode(req);
  const noSSR = disableSSR(req);

  const windowData = {
    ...data,
    chunkInfo: lazyChunkInfo,
    hash,
    restrictedMode,
    siteTheme,
    config: { ...config, disableSSR: noSSR },
  };

  if (noSSR) {
    return {
      status: OK,
      locale,
      data: {
        htmlContent: renderToString(
          <Document language={locale} chunkInfo={lazyChunkInfo} hash={hash} />,
        ),
        data: windowData,
      },
    };
  }

  const client = createApolloClient(locale, versionHash);
  const i18n = initializeI18n(locale);
  const redirect: RedirectInfo = {};

  const { query, dataRoutes } = createStaticHandler(routes, { basename });
  const context = await query(createFetchRequest(req));

  if (context instanceof Response) {
    throw context;
  }

  const router = createStaticRouter(dataRoutes, context);

  const page = (
    <AppShell
      language={locale}
      hash={hash}
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

  const result = await prerenderStatic({ tree: page, renderFunction: renderToString });

  if (redirect.url) {
    return {
      status: redirect.status || MOVED_PERMANENTLY,
      location: redirect.url,
    };
  }

  return {
    status: redirect.status ?? OK,
    locale,
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
