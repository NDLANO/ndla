/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Request, Response } from "express";
import { createContext, RouterContextProvider } from "react-router";
import type { RestrictedModeState } from "../components/RestrictedModeContext";
import config from "../config";
import type { LtiData, SiteTheme } from "../interfaces";
import { getSiteTheme } from "../util/siteTheme";
import { isRestrictedMode } from "./helpers/restrictedMode";

/** What Express knows about a request that the React render needs. */
export interface RequestInfo {
  restrictedMode: RestrictedModeState;
  versionHash?: string;
  siteTheme?: SiteTheme;
  disableSSR: boolean;
  ltiData?: LtiData;
}

export const requestInfoContext = createContext<RequestInfo>();

const isDisableSSR = (req: Request) => {
  if (req.query.disableSSR) {
    return req.query.disableSSR === "true";
  }
  return config.disableSSR;
};

export const getLoadContext = (req: Request, res: Response) => {
  const context = new RouterContextProvider();
  context.set(requestInfoContext, {
    restrictedMode: isRestrictedMode(req),
    versionHash: typeof req.query.versionHash === "string" ? req.query.versionHash : undefined,
    siteTheme: getSiteTheme(),
    disableSSR: isDisableSSR(req),
    ltiData: res.locals.ltiData,
  });
  return context;
};
