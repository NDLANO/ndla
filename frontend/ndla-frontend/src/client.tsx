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
import { getLocaleInfoFromPath, initializeI18n } from "./i18n";
import type { NDLAWindow } from "./interfaces";
import { withLocalePrefixes } from "./localeRoutes";
import { createApolloClient } from "./util/apiHelpers";
import { renderOrHydrate } from "./util/renderOrHydrate";
import { initSentry } from "./util/sentry";
import { initSkewDetection } from "./util/skewDetection";

declare global {
  interface Window extends NDLAWindow {}
}

const {
  DATA: { config, serverPath, serverResponse, chunkInfo, translations, restrictedMode, siteTheme },
} = window;

const localeRoutes = withLocalePrefixes(routes);

initSentry(config);

const { basename, abbreviation } = getLocaleInfoFromPath(serverPath ?? "");

const url = new URL(window.location.href);
const versionHash = url.searchParams.get("versionHash");

const client = createApolloClient(abbreviation, versionHash);

initSkewDetection(config.componentVersion);

const i18nInstance = initializeI18n(abbreviation, translations);

renderOrHydrate(document, localeRoutes, window.location.pathname, () => {
  const router = createBrowserRouter(localeRoutes);

  return (
    <AppShell
      language={basename}
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
    </AppShell>
  );
});
