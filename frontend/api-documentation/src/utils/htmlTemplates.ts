/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { STATUS_CODES } from "node:http";
import config from "../config.js";
import { SWAGGER_CONFIG_ELEMENT_ID, type SwaggerInitConfig } from "../swaggerClientConfig.js";
import { type ClientAssets, getClientAssets } from "./clientAssets.js";
import { embedJson } from "./embedJson.js";

/* eslint arrow-body-style: 0 */
/* eslint arrow-parens: 0 */

// Type alias for API route objects used in template generation
export type ApiRoute = {
  name: string;
  paths: string[];
};

const bodyInfo = `
   <div id='ndla_header'>
     <a href="/" class='home'>APIs from NDLA</a>
     <div id='slogan'>
       <a href="https://ndla.no">
         <img src="/static/pictures/ndla-logo.svg"/>
       </a>
       <p>Open Educational Resources For Secondary Schools</p>
     </div>
   </div>
   <div id='ingress_block'>
     <p>
       NDLA provides a rich set of endpoints to extract articles and specific components of our content.
       All content is made available based on content licenses and the specific licence is included in metadata and can be used to filter the result.
     </p>
     <p>
       In addition, we provide a search-api for all our content based on Elasticsearch simple search language.
     </p>
     <p>
       This is a beta level service, with no liability for the quality of the content and what the content is used for.
     </p>
   </div>
 `;

export const htmlTemplate = (body: string): string =>
  `<!doctype html>\n<html lang='nb' >
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <link href='/static/css/api-documentation.css' media='screen' rel='stylesheet' type='text/css'/>
    </head>
    <body>
      ${bodyInfo}
      <div id='content'>
        <ul>${body}</ul>
      </div>
    </body>
  </html>`;

export const apiDocsUri = (apiObj: { paths: string[] }): string | undefined => {
  for (const uri of apiObj.paths) {
    if (uri.startsWith("http")) {
      return uri;
    }

    if (uri.startsWith("/")) {
      return `${config.apiDomain}${uri}`;
    }
  }
  return undefined;
};

export const apiListTemplate = (path: string, routes: ApiRoute[]): string => {
  const filtered = [...routes].sort((a, b) => a.name.localeCompare(b.name));

  const listItems = filtered.map(
    (route) => `<li><a href="${path}swagger?url=${apiDocsUri(route)}">${route.name}</a></li>`,
  );
  return htmlTemplate(listItems.join(""));
};

export const htmlErrorTemplate = ({
  status,
  message,
  description,
  stacktrace,
}: {
  status: number;
  message: string;
  description: string;
  stacktrace: string;
}): string => {
  const statusMsg = STATUS_CODES[status] ?? "";
  return htmlTemplate(
    `
    <h1>${status} ${statusMsg}</h1>
    <div><b>Message: </b>${message}</div>
    <div><b>Description: </b>${description}</div>
    <div>${stacktrace}</div>
  `,
  );
};

const documentHead = (assets: ClientAssets): string => `
   <head>
     <title>Swagger UI</title>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,700|Source+Code+Pro:300,600|Titillium+Web:400,600,700"
           rel="stylesheet">
     <link rel="stylesheet" type="text/css" href="/swagger-ui-dist/swagger-ui.css">
     <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32"/>
     <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16"/>
     <link href='/static/css/api-documentation.css' media='screen' rel='stylesheet' type='text/css'/>
     ${assets.styles.map((href) => `<link rel="stylesheet" type="text/css" href="${href}"/>`).join("\n")}
   </head>
 `;

/** The swagger-ui bundle is a classic script, so it runs before the deferred module entry below. */
const bodyLogic = (swaggerConfig: SwaggerInitConfig, assets: ClientAssets): string => `
   <script src="/swagger-ui-dist/swagger-ui-bundle.js"></script>
   <script type="application/json" id="${SWAGGER_CONFIG_ELEMENT_ID}">${embedJson(swaggerConfig)}</script>
   ${assets.scripts.map((src) => `<script type="module" src="${src}"></script>`).join("\n")}
`;

const documentBody = (swaggerConfig: SwaggerInitConfig, assets: ClientAssets): string => `
 <body>
   ${bodyInfo}
   <div id="swagger-ui-container"></div>
   ${bodyLogic(swaggerConfig, assets)}
 </body>
 `;

export const index = (swaggerConfig: SwaggerInitConfig): string => {
  const assets = getClientAssets();
  return `
   <!DOCTYPE html>
   <html>
     ${documentHead(assets)}
     ${documentBody(swaggerConfig, assets)}
   </html>
 `;
};
