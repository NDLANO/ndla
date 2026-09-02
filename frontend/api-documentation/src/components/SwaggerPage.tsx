/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  SWAGGER_CONFIG_ELEMENT_ID,
  SWAGGER_CONTAINER_ELEMENT_ID,
  writeSwaggerConfig,
  type SwaggerInitConfig,
} from "../swaggerClientConfig.js";
import { clientAssets } from "../utils/clientAssets.js";
import { Document } from "./Document.js";

export const SwaggerPage = (swaggerConfig: SwaggerInitConfig) => {
  return (
    <Document
      head={
        <>
          <title>Swagger UI</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link
            href="https://fonts.googleapis.com/css?family=Open+Sans:400,700|Source+Code+Pro:300,600|Titillium+Web:400,600,700"
            rel="stylesheet"
          />
          <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
          <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
          {clientAssets.styles.map((href) => (
            <link key={href} rel="stylesheet" type="text/css" href={href} />
          ))}
        </>
      }
    >
      <div id={SWAGGER_CONTAINER_ELEMENT_ID} />
      <script
        type="application/json"
        id={SWAGGER_CONFIG_ELEMENT_ID}
        dangerouslySetInnerHTML={{ __html: writeSwaggerConfig(swaggerConfig) }}
      />
      {clientAssets.scripts.map((src) => (
        <script key={src} type="module" src={src} />
      ))}
    </Document>
  );
};
