/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SWAGGER_CONFIG_ELEMENT_ID, type SwaggerInitConfig } from "../swaggerClientConfig.js";

interface SwaggerUi {
  initOAuth(options: Record<string, unknown>): void;
}

declare const SwaggerUIBundle: (options: Record<string, unknown>) => SwaggerUi;

const readConfig = (): SwaggerInitConfig => {
  const element = document.getElementById(SWAGGER_CONFIG_ELEMENT_ID);
  if (!element?.textContent) {
    throw new Error(`Missing swagger config element #${SWAGGER_CONFIG_ELEMENT_ID}`);
  }
  return JSON.parse(element.textContent) as SwaggerInitConfig;
};

export const swaggerInit = ({ personalClientId }: SwaggerInitConfig): void => {
  const url = window.location.search.match(/url=([^&]+)/)?.[1];
  if (!url) return;

  const locationOrigin = `${window.location.protocol}//${window.location.host}`;
  const ui = SwaggerUIBundle({
    url: decodeURIComponent(url),
    dom_id: "#swagger-ui-container",
    supportedSubmitMethods: ["get", "post", "put", "patch", "delete"],
    defaultModelsExpandDepth: 0,
    oauth2RedirectUrl: `${locationOrigin}/static/oauth2-redirect.html`,
  });

  (window as Window & { swaggerUi?: SwaggerUi }).swaggerUi = ui;

  ui.initOAuth({
    clientId: personalClientId,
    realm: "ndla-realm",
    appName: "ndla-swagger",
    scopeSeparator: " ",
    additionalQueryStringParams: {
      audience: "ndla_system",
    },
  });
};

swaggerInit(readConfig());
