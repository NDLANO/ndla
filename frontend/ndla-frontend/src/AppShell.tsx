/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApolloClient } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { LinkPathContext } from "@ndla/safelink";
import type { i18n as I18n } from "i18next";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { AuthenticationContext } from "./components/AuthenticationContext";
import { DisableSSRContext } from "./components/DisableSSRContext";
import { LtiContextProvider } from "./components/LtiContext";
import { RedirectContext, type RedirectInfo } from "./components/RedirectContext";
import { ResponseContext, type ResponseInfo } from "./components/ResponseContext";
import { RestrictedModeProvider, type RestrictedModeState } from "./components/RestrictedModeContext";
import { SiteThemeProvider } from "./components/SiteThemeContext";
import { VersionHashProvider } from "./components/VersionHashContext";
import type { LtiData, PathLocale, SiteTheme } from "./interfaces";
import type { AppType } from "./util/appPath";
import { unreachable } from "./util/guards";
import { createLocalePathResolver } from "./util/localePath";

interface Props {
  appType: AppType;
  language: PathLocale;
  redirect?: RedirectInfo;
  response?: ResponseInfo;
  restrictedMode?: RestrictedModeState;
  versionHash?: string | null;
  siteTheme?: SiteTheme;
  i18n: I18n;
  client: ApolloClient;
  disableSSR: boolean;
  ltiData?: LtiData;
  children: ReactNode;
}

export const AppShell = ({
  appType,
  language,
  redirect,
  response,
  restrictedMode,
  versionHash,
  siteTheme,
  i18n,
  client,
  disableSSR,
  ltiData,
  children,
}: Props) => {
  const resolveLinkPath = useMemo(() => createLocalePathResolver(language), [language]);

  return (
    <RedirectContext value={redirect}>
      <ResponseContext value={response}>
        <RestrictedModeProvider value={restrictedMode}>
          <VersionHashProvider value={versionHash}>
            <SiteThemeProvider value={siteTheme}>
              <I18nextProvider i18n={i18n}>
                <LinkPathContext value={resolveLinkPath}>
                  <DisableSSRContext value={disableSSR}>
                    <ApolloProvider client={client}>
                      <AppTypeContext appType={appType} ltiData={ltiData}>
                        {children}
                      </AppTypeContext>
                    </ApolloProvider>
                  </DisableSSRContext>
                </LinkPathContext>
              </I18nextProvider>
            </SiteThemeProvider>
          </VersionHashProvider>
        </RestrictedModeProvider>
      </ResponseContext>
    </RedirectContext>
  );
};

interface AppTypeContextProps {
  appType: AppType;
  children: ReactNode;
  ltiData?: LtiData;
}

const AppTypeContext = ({ appType, children, ltiData }: AppTypeContextProps) => {
  switch (appType) {
    case "default":
      return <AuthenticationContext>{children}</AuthenticationContext>;
    case "lti":
      return <LtiContextProvider ltiData={ltiData}>{children}</LtiContextProvider>;
    case "iframe":
      return children;
    default:
      return unreachable(appType);
  }
};
