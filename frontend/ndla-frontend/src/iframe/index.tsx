/**
 * Copyright (c) 2016-present, NDLA.
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
import { iframeArticleRoutes } from "./iframeArticleRoutes";

const { config, initialProps, chunkInfo, hash, restrictedMode } = window.DATA;

initSentry(config);

const language = initialProps.locale ?? config.defaultLocale;

const client = createApolloClient(language);
const i18n = initializeI18n(language, hash);

const router = createBrowserRouter(iframeArticleRoutes);

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
  iframeArticleRoutes,
  window.location.pathname,
);
