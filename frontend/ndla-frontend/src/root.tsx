/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "./style/index.css";
import { NoSSR } from "@ndla/util";
import { type ReactNode, use } from "react";
import { useTranslation } from "react-i18next";
import { Links, Meta, Outlet, Scripts as RouterScripts } from "react-router";
import { DisableSSRContext } from "./components/DisableSSRContext";
import { Scripts } from "./components/Scripts/Scripts";
import config from "./config";
import { ErrorElement } from "./RouteErrorElement";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { i18n } = useTranslation();
  const faviconEnvironment = config.ndlaEnvironment === "dev" ? "test" : config.ndlaEnvironment;

  return (
    <html lang={i18n.language}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href={`/static/favicon-${faviconEnvironment}-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`/static/favicon-${faviconEnvironment}-16x16.png`} />
        <link
          rel="apple-touch-icon"
          type="image/png"
          sizes="180x180"
          href={`/static/apple-touch-icon-${faviconEnvironment}.png`}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preload" href="https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap" as="style" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap" />
        <Meta />
        <Links />
      </head>
      <body>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
      window.dataLayer = window.dataLayer || [];
      window._mtm = window._mtm || [];
      window.originalLocation = {
        originalLocation:
          document.location.protocol +
          "//" +
          document.location.hostname +
          document.location.pathname +
          document.location.search,
      };
      window.dataLayer.push(window.originalLocation);
`,
          }}
        ></script>
        <script
          // We're hydrating the entire document. Our config differentiates between server and client, so it's necessary to suppress any hydration warnings here. TODO: Find a better workaround for this
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: config.isClient ? "" : `window.DATA = "$WINDOW_DATA"`,
          }}
        ></script>
        <Scripts />
        <div id="root">{children}</div>
        <RouterScripts />
      </body>
    </html>
  );
};

const App = () => {
  const disableSSR = use(DisableSSRContext);
  // Without SSR, the server only renders the document. The app renders once the browser has hydrated it,
  // so every API call is made from the browser.
  return disableSSR ? (
    <NoSSR fallback={null}>
      <Outlet />
    </NoSSR>
  ) : (
    <Outlet />
  );
};

export default App;

export const ErrorBoundary = () => <ErrorElement />;
