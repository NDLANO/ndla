/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApolloClient } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { MissingRouterContext } from "@ndla/safelink";
import type { i18n as I18n } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { AuthenticationContext } from "./components/AuthenticationContext";
import { RedirectContext, type RedirectInfo } from "./components/RedirectContext";
import { ResponseContext, type ResponseInfo } from "./components/ResponseContext";
import { RestrictedModeProvider, type RestrictedModeState } from "./components/RestrictedModeContext";
import { SiteThemeProvider } from "./components/SiteThemeContext";
import { VersionHashProvider } from "./components/VersionHashContext";
import { Document } from "./Document";
import type { SiteTheme } from "./interfaces";
import type { RouteChunkInfo } from "./server/serverHelpers";

interface Props {
  language: string;
  hash: string;
  chunkInfo: RouteChunkInfo;
  i18n: I18n;
  client?: ApolloClient;
  restrictedMode?: RestrictedModeState;
  siteTheme?: SiteTheme;
  versionHash?: string | null;
  redirect?: RedirectInfo;
  response?: ResponseInfo;
  missingRouter?: boolean;
  useAuthenticationContext?: boolean;
  children: ReactNode;
}

export const AppShell = ({
  language,
  hash,
  chunkInfo,
  i18n,
  client,
  restrictedMode,
  siteTheme,
  versionHash,
  redirect,
  response,
  missingRouter = false,
  useAuthenticationContext: useAuthentication,
  children,
}: Props) => (
  <Document language={language} chunkInfo={chunkInfo} hash={hash}>
    <RedirectContext value={redirect}>
      <ResponseContext value={response}>
        <RestrictedModeProvider value={restrictedMode}>
          <VersionHashProvider value={versionHash}>
            <SiteThemeProvider value={siteTheme}>
              <I18nextProvider i18n={i18n}>
                <MissingRouterContext value={missingRouter}>
                  <ApolloAndAuthenticationProvider client={client} useAuthenticationContext={useAuthentication}>
                    {children}
                  </ApolloAndAuthenticationProvider>
                </MissingRouterContext>
              </I18nextProvider>
            </SiteThemeProvider>
          </VersionHashProvider>
        </RestrictedModeProvider>
      </ResponseContext>
    </RedirectContext>
  </Document>
);

const ApolloAndAuthenticationProvider = ({
  client,
  useAuthenticationContext,
  children,
}: Pick<Props, "client" | "useAuthenticationContext" | "children">) =>
  client ? (
    <ApolloProvider client={client}>
      {useAuthenticationContext ? <AuthenticationContext>{children}</AuthenticationContext> : children}
    </ApolloProvider>
  ) : (
    children
  );
