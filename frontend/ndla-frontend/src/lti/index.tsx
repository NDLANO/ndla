/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "../style/index.css";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AppShell } from "../AppShell";
import { LtiContextProvider } from "../components/LtiContext";
import { initializeI18n } from "../i18n";
import { createApolloClient } from "../util/apiHelpers";
import { initSentry } from "../util/sentry";
import { routes } from "./routes";

const {
  DATA: { initialProps, config, chunkInfo, translations, restrictedMode },
} = window;

initSentry(config);

const language = config.defaultLocale;
const client = createApolloClient(language);
const i18n = initializeI18n(language, translations);

const router = createMemoryRouter(routes);

const root = createRoot(document);
root.render(
  <AppShell language={language} chunkInfo={chunkInfo} i18n={i18n} client={client} restrictedMode={restrictedMode}>
    <LtiContextProvider ltiData={initialProps.ltiData}>
      <RouterProvider router={router} />
    </LtiContextProvider>
  </AppShell>,
);
