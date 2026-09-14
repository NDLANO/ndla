/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Request } from "express";
import type { ReactNode } from "react";
import { prerenderToNodeStream } from "react-dom/static";
import config from "../../config";

export const disableSSR = (req: Request) => {
  if (req.query.disableSSR) {
    return req.query.disableSSR === "true";
  }
  return config.disableSSR;
};

export const prerenderToString = async (tree: ReactNode): Promise<string> => {
  const { prelude } = await prerenderToNodeStream(tree);
  prelude.setEncoding("utf8");
  let html = "";
  for await (const chunk of prelude) {
    html += chunk;
  }
  return html;
};
