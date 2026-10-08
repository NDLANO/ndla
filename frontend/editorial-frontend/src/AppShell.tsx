/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LinkPathContext } from "@ndla/safelink";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { i18n as I18n } from "i18next";
import { type ReactElement, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { AuthInitializer } from "./components/AuthInitializer";
import { MessagesProvider } from "./containers/Messages/MessagesProvider";
import { type SessionState, SessionProvider } from "./containers/Session/SessionProvider";
import type { PathLocale } from "./interfaces";
import { createLocalePathResolver } from "./util/localePath";

interface Props {
  pathLocale: PathLocale;
  i18n: I18n;
  queryClient: QueryClient;
  session: SessionState;
  children: ReactElement;
}

export const AppShell = ({ pathLocale, i18n, queryClient, session, children }: Props) => {
  const resolveLinkPath = useMemo(() => createLocalePathResolver(pathLocale), [pathLocale]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <LinkPathContext value={resolveLinkPath}>
          <MessagesProvider>
            <SessionProvider initialValue={session}>
              <AuthInitializer>{children}</AuthInitializer>
            </SessionProvider>
          </MessagesProvider>
        </LinkPathContext>
      </I18nextProvider>
    </QueryClientProvider>
  );
};
