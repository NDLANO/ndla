/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCookie } from "@ndla/util";
import type { Request, Response } from "express";
import { createContext, RouterContextProvider } from "react-router";
import { ACCESS_TOKEN_COOKIE } from "../constants";

/** What Express knows about a request that the React render needs. */
export interface RequestInfo {
  accessToken?: string;
}

export const requestInfoContext = createContext<RequestInfo>();

export const getLoadContext = (req: Request, res: Response) => {
  const context = new RouterContextProvider();
  context.set(requestInfoContext, {
    // A token refreshed earlier in this request is only in the response cookies, not in the request
    accessToken: res.locals.accessToken ?? getCookie(ACCESS_TOKEN_COOKIE, req.headers.cookie ?? ""),
  });
  return context;
};
