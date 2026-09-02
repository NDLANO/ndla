/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  buildFeideLogoutUrl,
  completeFeideLogin,
  feideTokenExpiry,
  getFeideOidcConfig,
  safeReturnPath,
  startFeideLogin,
  upsertMyNdlaUser,
} from "@ndla/server";
import type { MyNDLAUserDTO } from "@ndla/types-backend/myndla-api";
import { getCookie, getDecodedCookie } from "@ndla/util";
import express, { type CookieOptions, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { matchPath } from "react-router";
import config from "../config";
import {
  AUTOLOGIN_COOKIE,
  FEIDE_ID_TOKEN_COOKIE,
  NODEBB_AUTH_COOKIE,
  NONCE_COOKIE,
  PKCE_CODE_COOKIE,
  RETURN_TO_COOKIE,
  SESSION_EXPIRY_COOKIE,
  STATE_COOKIE,
} from "../constants";
import { getLocaleInfoFromPath, isValidLocale } from "../i18n";
import { routes } from "../routeHelpers";
import { privateRoutes } from "../routes";
import { BAD_REQUEST } from "../statusCodes";
import { apiBaseUrl } from "../util/apiHelpers";
import { isActiveSession } from "../util/authHelpers";
import { log } from "../util/logger/logger";
import { constructNewPath } from "../util/urlHelper";

const usernameSanitizerRegexp = new RegExp(/[^'"\s\-.*0-9\u00BF-\u1FFF\u2C00-\uD7FF\w]+/);

const FEIDE_CLIENT_ID = process.env.FEIDE_CLIENT_ID ?? "";
const DEPLOYED = process.env.IS_VERCEL === "true" || process.env.NDLA_IS_KUBERNETES !== undefined;
const PROTOCOL = DEPLOYED ? "https" : "http";
const PORT = DEPLOYED ? "" : `:${config.port}`;
const SAME_SITE: CookieOptions["sameSite"] = DEPLOYED ? "lax" : undefined;
const NODEBB_DOMAIN = config.feideDomain ? `.${config.feideDomain}` : undefined;

const stateOptions: CookieOptions = { httpOnly: true, sameSite: DEPLOYED ? "none" : undefined, secure: DEPLOYED };
const pkceOptions: CookieOptions = { httpOnly: true, sameSite: DEPLOYED ? "none" : undefined, secure: DEPLOYED };
const nonceOptions: CookieOptions = { httpOnly: true, sameSite: DEPLOYED ? "none" : undefined, secure: DEPLOYED };
const returnToOptions: CookieOptions = { httpOnly: true, sameSite: DEPLOYED ? "none" : undefined, secure: DEPLOYED };
const sessionExpiryOptions: CookieOptions = { sameSite: SAME_SITE, secure: DEPLOYED };
const nodeBbOptions: CookieOptions = { httpOnly: true, secure: DEPLOYED, domain: NODEBB_DOMAIN, sameSite: SAME_SITE };
const idTokenOptions: CookieOptions = { sameSite: SAME_SITE, secure: DEPLOYED };

const router = express.Router();

const clearTemporaryCookies = (res: Response) => {
  res.clearCookie(PKCE_CODE_COOKIE, pkceOptions);
  res.clearCookie(STATE_COOKIE, stateOptions);
  res.clearCookie(NONCE_COOKIE, nonceOptions);
  res.clearCookie(RETURN_TO_COOKIE, returnToOptions);
};

const parseSafeRedirect = (url: string): string | URL | undefined => {
  const path = safeReturnPath(url);
  if (path) return path;

  try {
    const parsed = new URL(url, config.ndlaFrontendDomain);
    return parsed.hostname === config.arenaDomain ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const getConfig = () => getFeideOidcConfig(FEIDE_CLIENT_ID);

router.get(["/login", "/:lang/login"], async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  const activeSessionCookie = getCookie(SESSION_EXPIRY_COOKIE, req.headers.cookie ?? "");
  const returnTo =
    (typeof req.query.returnTo === "string" ? req.query.returnTo : undefined) ??
    getDecodedCookie(RETURN_TO_COOKIE, req.headers.cookie ?? "");
  const safeReturnTo = returnTo ? parseSafeRedirect(returnTo) : undefined;

  let redirect = "/";
  if (safeReturnTo instanceof URL) {
    redirect = safeReturnTo.toString();
  } else if (safeReturnTo) {
    const langParam = typeof req.params.lang === "string" ? req.params.lang : undefined;
    const lang = langParam ? (isValidLocale(langParam) ? langParam : config.defaultLocale) : undefined;
    redirect = constructNewPath(safeReturnTo, lang);
  }

  if (activeSessionCookie && isActiveSession(activeSessionCookie)) {
    return res.redirect(redirect);
  }

  const handshake = await startFeideLogin(await getConfig(), {
    redirectUri: `${PROTOCOL}://${req.hostname}${PORT}/login/success`,
    loginHint: config.loginHint,
  });

  res.cookie(STATE_COOKIE, handshake.state, stateOptions);
  res.cookie(PKCE_CODE_COOKIE, handshake.codeVerifier, pkceOptions);
  res.cookie(NONCE_COOKIE, handshake.nonce, nonceOptions);
  res.cookie(RETURN_TO_COOKIE, redirect, returnToOptions);
  return res.redirect(handshake.authorizationUrl);
});

router.get("/login/success", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  res.setHeader("Cache-Control", "no-store");
  const verifier = getCookie(PKCE_CODE_COOKIE, req.headers.cookie ?? "");
  const state = getCookie(STATE_COOKIE, req.headers.cookie ?? "");
  const nonce = getCookie(NONCE_COOKIE, req.headers.cookie ?? "");
  const returnToCookie = getDecodedCookie(RETURN_TO_COOKIE, req.headers.cookie ?? "");
  const returnTo = (returnToCookie && parseSafeRedirect(returnToCookie)) ?? "/";
  const redirect = returnTo instanceof URL ? returnTo.toString() : returnTo;

  if (!code || !verifier || !state || !nonce) {
    clearTemporaryCookies(res);
    res.status(BAD_REQUEST).send({ error: "Missing code, state, nonce or verifier" });
    return;
  }

  if (req.query.state !== state) {
    clearTemporaryCookies(res);
    res.status(BAD_REQUEST).send({ error: "State does not match" });
    return;
  }

  const tokens = await completeFeideLogin(await getConfig(), {
    currentUrl: `${PROTOCOL}://${req.hostname}${PORT}${req.url}`,
    codeVerifier: verifier,
    state,
    nonce,
  }).catch((error: Error) => {
    log.error("Error during authorization code grant:", error);
    clearTemporaryCookies(res);
    return Promise.reject(error);
  });

  clearTemporaryCookies(res);

  let userInfo: MyNDLAUserDTO | undefined = undefined;
  try {
    userInfo = await upsertMyNdlaUser({
      apiUrl: apiBaseUrl,
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
    });

    const expires = feideTokenExpiry(tokens);
    if (!expires) throw new Error("Feide id token has no exp claim");

    res.cookie(FEIDE_ID_TOKEN_COOKIE, tokens.id_token, {
      ...idTokenOptions,
      expires,
    });
    res.cookie(SESSION_EXPIRY_COOKIE, expires.getTime(), {
      ...sessionExpiryOptions,
      expires,
    });
  } catch (error) {
    log.error("Failed to create/update MyNDLA user using Feide tokens", { error });
  }

  // Set cookie for nodebb to use if user is arena enabled
  try {
    const nodeBbSecret = process.env.NODEBB_SECRET;
    if (!nodeBbSecret && DEPLOYED) {
      throw new Error("NODEBB_SECRET is not defined");
    }
    if (userInfo && userInfo.arenaEnabled) {
      const nodebbUser = {
        id: userInfo.feideId,
        username: userInfo.username?.replace(usernameSanitizerRegexp, "-"),
        fullname: userInfo.displayName,
        email: userInfo.email,
        groups: ["unverified-users"],
      };
      //fallback for local development
      const nodebbCookieString = jwt.sign(nodebbUser, nodeBbSecret ?? "secret");
      res.cookie(NODEBB_AUTH_COOKIE, nodebbCookieString, {
        ...nodeBbOptions,
        maxAge: (tokens.expiresIn() ?? 0) * 1000,
      });
    }
  } catch (error) {
    log.error("Failed to set cookie for nodebb autologin", { error });
  }

  if (config.autologinCookieEnabled) {
    // Set cookie to automatically send user to feide if present
    res.cookie(AUTOLOGIN_COOKIE, "true", { domain: NODEBB_DOMAIN });
  }
  return res.redirect(redirect);
});

router.get(["/logout", "/:lang/logout"], async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const safeReturnTo = typeof req.query.returnTo === "string" ? parseSafeRedirect(req.query.returnTo) : undefined;
  if (safeReturnTo) {
    res.cookie(RETURN_TO_COOKIE, safeReturnTo instanceof URL ? safeReturnTo.toString() : safeReturnTo, returnToOptions);
  }

  const idToken = getCookie(FEIDE_ID_TOKEN_COOKIE, req.headers.cookie ?? "");
  if (!idToken) {
    res.redirect("/");
    return;
  }

  const oidcConfig = await getConfig();

  res.clearCookie(FEIDE_ID_TOKEN_COOKIE, idTokenOptions);
  res.clearCookie(SESSION_EXPIRY_COOKIE, sessionExpiryOptions);
  res.clearCookie(NODEBB_AUTH_COOKIE, nodeBbOptions);

  return res.redirect(
    buildFeideLogoutUrl(oidcConfig, {
      postLogoutRedirectUri: `${PROTOCOL}://${req.hostname}${PORT}/logout/session`,
      idToken,
    }),
  );
});

router.get("/logout/session", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const returnToCookie = getDecodedCookie(RETURN_TO_COOKIE, req.headers.cookie ?? "");
  res.clearCookie(RETURN_TO_COOKIE, returnToOptions);
  const returnTo = returnToCookie && parseSafeRedirect(returnToCookie);

  if (returnTo instanceof URL) {
    return res.redirect(returnTo.toString());
  }

  const { basepath, basename } = getLocaleInfoFromPath(returnTo ?? "/");
  const wasPrivateRoute = privateRoutes.some((r) => matchPath(r, basepath));
  const redirect =
    wasPrivateRoute || basepath === routes.myNdla.root ? constructNewPath("/", basename) : (returnTo ?? "/");
  return res.redirect(redirect);
});

export default router;
