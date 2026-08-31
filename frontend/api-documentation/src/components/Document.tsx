/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from "react";
import { BodyInfo } from "./BodyInfo.js";

export const Document = ({ head, children }: { head?: ReactNode; children: ReactNode }) => (
  <html lang="nb">
    <head>
      <meta charSet="utf-8" />
      {head}
      <link href="/static/css/api-documentation.css" media="screen" rel="stylesheet" type="text/css" />
    </head>
    <body>
      <BodyInfo />
      {children}
    </body>
  </html>
);
