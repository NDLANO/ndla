/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRoot } from "react-dom/client";
import SwaggerUI from "swagger-ui-react";
import { SWAGGER_CONTAINER_ELEMENT_ID, readSwaggerConfig, type SwaggerInitConfig } from "../swaggerClientConfig.js";
import "swagger-ui-react/swagger-ui.css";
import { attachFeideAuth } from "./feide/authorize.js";
import { feideAuthPlugin } from "./feide/feideAuthPlugin.js";
import type { SwaggerSystem } from "./swaggerUiTypes.js";

export const swaggerInit = ({ personalClientId }: SwaggerInitConfig): void => {
  const url = window.location.search.match(/url=([^&]+)/)?.[1];
  if (!url) return;

  const container = document.getElementById(SWAGGER_CONTAINER_ELEMENT_ID);
  if (!container) throw new Error(`Missing swagger container #${SWAGGER_CONTAINER_ELEMENT_ID}`);

  const locationOrigin = `${window.location.protocol}//${window.location.host}`;

  createRoot(container).render(
    <SwaggerUI
      url={decodeURIComponent(url)}
      supportedSubmitMethods={["get", "post", "put", "patch", "delete"]}
      defaultModelsExpandDepth={0}
      oauth2RedirectUrl={`${locationOrigin}/static/oauth2-redirect.html`}
      plugins={[feideAuthPlugin]}
      onComplete={(system: SwaggerSystem) => {
        system.initOAuth({
          clientId: personalClientId,
          realm: "ndla-realm",
          appName: "ndla-swagger",
          scopeSeparator: " ",
          additionalQueryStringParams: {
            audience: "ndla_system",
          },
        });
        attachFeideAuth(system);
      }}
    />,
  );
};

swaggerInit(readSwaggerConfig());
