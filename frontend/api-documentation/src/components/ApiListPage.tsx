/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "../config.js";
import { Document } from "./Document.js";

export type ApiRoute = {
  name: string;
  paths: string[];
};

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

export const ApiListPage = ({ path, routes }: { path: string; routes: ApiRoute[] }) => {
  const sorted = [...routes].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Document head={<meta httpEquiv="X-UA-Compatible" content="IE=edge" />}>
      <div id="content">
        <ul>
          {sorted.map((route) => (
            <li key={route.name}>
              <a href={`${path}swagger?url=${apiDocsUri(route)}`}>{route.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </Document>
  );
};
