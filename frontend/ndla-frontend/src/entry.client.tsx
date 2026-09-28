/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { startTransition } from "react";
import { type ErrorInfo, hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { AppShell } from "./AppShell";
import { initializeI18n } from "./i18n";
import type { NDLAWindow } from "./interfaces";
import { createApolloClient } from "./util/apiHelpers";
import { getAppPathInfo } from "./util/appPath";
import { ensureError, handleError } from "./util/handleError";
import { initSentry } from "./util/sentry";
import { initSkewDetection } from "./util/skewDetection";

declare global {
  interface Window extends NDLAWindow {}
}

const {
  DATA: { config, serverPath, serverResponse, initialProps, translations, restrictedMode, siteTheme },
} = window;

initSentry(config);

const { appType, pathLocale, locale } = getAppPathInfo(serverPath ?? window.location.pathname);
const versionHash = appType === "default" ? new URL(window.location.href).searchParams.get("versionHash") : undefined;

const client = createApolloClient(locale, versionHash);
const i18n = initializeI18n(locale, translations);

if (appType !== "lti") {
  initSkewDetection(config.componentVersion);
}

const handleRootError = (phase: "hydration" | "render") => (error: unknown, errorInfo: ErrorInfo) =>
  handleError(ensureError(error), { phase, componentStack: errorInfo.componentStack });

startTransition(() => {
  hydrateRoot(
    document,
    <AppShell
      appType={appType}
      language={pathLocale}
      i18n={i18n}
      client={client}
      restrictedMode={restrictedMode}
      siteTheme={siteTheme}
      versionHash={versionHash}
      response={{ status: serverResponse }}
      disableSSR={config.disableSSR}
      ltiData={initialProps?.ltiData}
    >
      <HydratedRouter />
    </AppShell>,
    {
      onRecoverableError: handleRootError("hydration"),
      onUncaughtError: import.meta.env.PROD ? handleRootError("render") : undefined,
    },
  );
});
