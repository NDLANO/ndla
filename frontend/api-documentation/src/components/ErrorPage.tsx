/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { STATUS_CODES } from "node:http";
import { Document } from "./Document.js";

export interface ErrorPageProps {
  status: number;
  message: string;
  description: string;
  stacktrace: string;
}
export const ErrorPage = ({ status, message, description, stacktrace }: ErrorPageProps) => (
  <Document head={<meta httpEquiv="X-UA-Compatible" content="IE=edge" />}>
    <div id="content">
      <h1>
        {status} {STATUS_CODES[status] ?? ""}
      </h1>
      <div>
        <b>Message: </b>
        {message}
      </div>
      <div>
        <b>Description: </b>
        {description}
      </div>
      <div>{stacktrace}</div>
    </div>
  </Document>
);
