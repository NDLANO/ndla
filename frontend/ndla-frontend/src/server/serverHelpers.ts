/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Request, Response } from "express";
import serialize from "serialize-javascript";
import { OK, MOVED_PERMANENTLY, TEMPORARY_REDIRECT, GONE } from "../statusCodes";
import { NDLAError } from "../util/error/NDLAError";
import { handleError } from "../util/handleError";

export const sendResponse = (req: Request, res: Response, data: any, status = OK) => {
  if (status >= 500) {
    handleError(new NDLAError(`Returning code ${status} for ${req.url}`), {
      statusCode: status,
    });
  }

  if (status === MOVED_PERMANENTLY || status === TEMPORARY_REDIRECT) {
    res.writeHead(status, data);
    res.end();
  } else if (status === GONE) {
    res.status(status).send(data);
  } else if (res.getHeader("Content-Type") === "application/json") {
    res.status(status).json(data);
  } else {
    res.status(status).send(data);
  }
};

export const injectWindowData = <T extends object>(htmlContent: string, data: T & { config?: object }): string => {
  const serializedData = serialize({
    ...data,
    config: {
      ...data?.config,
      isClient: true,
    },
  });
  // Use function instead of string for replacement, since `String.replace` supports replacement patterns like `$$` for string arguments.
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
  return htmlContent.replace('"$WINDOW_DATA"', () => serializedData);
};
