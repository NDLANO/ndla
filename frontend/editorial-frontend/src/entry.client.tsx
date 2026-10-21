/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { AppShell } from "./AppShell";
import config from "./config";
import { getSessionStateFromCookie } from "./containers/Session/SessionProvider";
import { getLocaleInfoFromPath, initializeI18n } from "./i18n";
import { getAccessToken } from "./util/authHelpers";
import handleError from "./util/handleError";
import { createQueryClient } from "./util/queryClient";
import { initSentry } from "./util/sentry";

initSentry(config);

const { basename, abbreviation } = getLocaleInfoFromPath(window.location.pathname);

const i18n = initializeI18n(abbreviation);
const queryClient = createQueryClient();

startTransition(() => {
  hydrateRoot(
    document,
    <AppShell
      pathLocale={basename}
      i18n={i18n}
      queryClient={queryClient}
      session={getSessionStateFromCookie(getAccessToken())}
    >
      <HydratedRouter />
    </AppShell>,
    {
      onRecoverableError: (error, errorInfo) => handleError(error, errorInfo.componentStack),
    },
  );
});
