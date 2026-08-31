/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "./style/index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { routes } from "./appRoutes";
import { AppShell } from "./AppShell";
import { AuthenticationContext } from "./components/AuthenticationContext";
import { getLocaleInfoFromPath, initializeI18n, isValidLocale } from "./i18n";
import type { NDLAWindow } from "./interfaces";
import { createApolloClient } from "./util/apiHelpers";
import { renderOrHydrate } from "./util/renderOrHydrate";
import { initSentry } from "./util/sentry";
import { initSkewDetection } from "./util/skewDetection";

declare global {
  interface Window extends NDLAWindow {}
}

const {
  DATA: { config, serverPath, serverResponse, chunkInfo, hash, restrictedMode, siteTheme },
} = window;

initSentry(config);

const { abbreviation, basepath } = getLocaleInfoFromPath(serverPath ?? "");

const paths = window.location.pathname.split("/");
const basename = isValidLocale(paths[1] ?? "") ? `${paths[1]}` : undefined;

const url = new URL(window.location.href);
const versionHash = url.searchParams.get("versionHash");

const client = createApolloClient(abbreviation, versionHash);

const router = createBrowserRouter(routes, { basename: basename ? `/${basename}` : undefined });

initSkewDetection(config.componentVersion);

const i18nInstance = initializeI18n(abbreviation, hash);

renderOrHydrate(
  document,
  <AppShell
    language={isValidLocale(abbreviation) ? abbreviation : config.defaultLocale}
    hash={hash}
    chunkInfo={chunkInfo}
    i18n={i18nInstance}
    client={client}
    restrictedMode={restrictedMode}
    siteTheme={siteTheme}
    versionHash={versionHash}
    response={{ status: serverResponse }}
  >
    <AuthenticationContext>
      <RouterProvider router={router} />
    </AuthenticationContext>
  </AppShell>,
  routes,
  basepath,
);
