/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "./style/index.css";
import { NoSSR } from "@ndla/util";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Links, Meta, Outlet, Scripts } from "react-router";
import { ConfigScript } from "./components/ConfigScript";
import { ErrorElement } from "./components/RouteErrorElement";
import config from "./config";
import Formbricks from "./scripts/Formbricks";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { i18n } = useTranslation();

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" sizes="32x32" href={`/static/favicon-${config.ndlaEnvironment}-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`/static/favicon-${config.ndlaEnvironment}-16x16.png`} />
        <link
          rel="apple-touch-icon"
          type="image/png"
          sizes="180x180"
          href={`/static/apple-touch-icon-${config.ndlaEnvironment}.png`}
        />
        <link rel="manifest" href="/static/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap" rel="stylesheet" />
        <Meta />
        <Links />
      </head>
      <body>
        <ConfigScript />
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
        />
        <script
          type="text/x-mathjax-config"
          defer
          dangerouslySetInnerHTML={{
            __html: `
      MathJax = {
        options: {
          enableExplorerHelp: false,
          renderActions: {
            addMenu: [],
            checkLoading: []
          },
          menuOptions: {
            settings: {
              zoom: "None"
            }
          }
        }
      };
`,
          }}
        />
        <script type="text/javascript" defer src="https://cdn.jsdelivr.net/npm/mathjax@4.1.1/mml-chtml.js" />
        <Formbricks />
        <div id="root">{children}</div>
        <Scripts />
      </body>
    </html>
  );
};

const App = () => (
  <>
    <Outlet />
    <NoSSR fallback={null}>
      <ReactQueryDevtools />
    </NoSSR>
  </>
);

export default App;

export const ErrorBoundary = () => <ErrorElement />;
