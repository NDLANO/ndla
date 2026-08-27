/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "../../style/index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { errorRoutes } from "../../appRoutes";
import { AppShell } from "../../AppShell";
import { getLocaleInfoFromPath, initializeI18n } from "../../i18n";
import { renderOrHydrate } from "../../util/renderOrHydrate";
import { initSentry } from "../../util/sentry";

const { config, serverPath, chunkInfo, hash, restrictedMode, siteTheme } = window.DATA;

initSentry(config);

const { abbreviation, basepath } = getLocaleInfoFromPath(serverPath ?? "");
const i18n = initializeI18n(abbreviation, hash);

const router = createBrowserRouter(errorRoutes);

renderOrHydrate(
  document,
  <AppShell
    language={abbreviation}
    hash={hash}
    chunkInfo={chunkInfo}
    i18n={i18n}
    restrictedMode={restrictedMode}
    siteTheme={siteTheme}
    missingRouter
  >
    <RouterProvider router={router} />
  </AppShell>,
  errorRoutes,
  basepath,
);
