/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { embedJson } from "./utils/embedJson.js";

export const SWAGGER_CONFIG_ELEMENT_ID = "ndla-swagger-config";
export const SWAGGER_CONTAINER_ELEMENT_ID = "swagger-ui-container";

export interface SwaggerInitConfig {
  personalClientId: string;
}

export const writeSwaggerConfig = (config: SwaggerInitConfig): string => embedJson(config);

export const readSwaggerConfig = (): SwaggerInitConfig => {
  const element = document.getElementById(SWAGGER_CONFIG_ELEMENT_ID);
  if (!element?.textContent) {
    throw new Error(`Missing swagger config element #${SWAGGER_CONFIG_ELEMENT_ID}`);
  }
  return JSON.parse(element.textContent) as SwaggerInitConfig;
};
