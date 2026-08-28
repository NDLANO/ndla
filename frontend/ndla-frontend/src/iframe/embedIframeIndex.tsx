/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "../style/index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppShell } from "../AppShell";
import { initializeI18n } from "../i18n";
import { createApolloClient } from "../util/apiHelpers";
import { renderOrHydrate } from "../util/renderOrHydrate";
import { initSentry } from "../util/sentry";
import { initSkewDetection } from "../util/skewDetection";
import { iframeEmbedRoutes } from "./embedIframeRoutes";

const { config, initialProps, chunkInfo, hash, restrictedMode } = window.DATA;

initSentry(config);

const language = initialProps.locale ?? config.defaultLocale;

const client = createApolloClient(language, undefined);
const i18n = initializeI18n(language, hash);

const router = createBrowserRouter(iframeEmbedRoutes);

initSkewDetection(config.componentVersion);

renderOrHydrate(
  document,
  <AppShell
    language={language}
    hash={hash}
    chunkInfo={chunkInfo}
    i18n={i18n}
    client={client}
    restrictedMode={restrictedMode}
    missingRouter
  >
    <RouterProvider router={router} />
  </AppShell>,
  iframeEmbedRoutes,
  window.location.pathname,
);
