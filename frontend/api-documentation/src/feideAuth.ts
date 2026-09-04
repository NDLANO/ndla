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
import {
  FEIDE_ID_TOKEN_COOKIE,
  FEIDE_NONCE_COOKIE,
  FEIDE_PKCE_CODE_COOKIE,
  FEIDE_RETURN_TO_COOKIE,
  FEIDE_STATE_COOKIE,
  getCookie,
  getDecodedCookie,
} from "@ndla/util";
import express, { type CookieOptions, type Request, type Response } from "express";
import config from "./config.js";
import log from "./utils/logger.js";

const DEFAULT_RETURN_TO = "/swagger";

const handshakeOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "lax",
  path: "/",
};

const idTokenOptions: CookieOptions = {
  httpOnly: false,
  secure: config.isProduction,
  sameSite: "lax",
  path: "/",
};

const returnTo = (raw: unknown): string =>
  safeReturnPath(typeof raw === "string" ? raw : undefined) ?? DEFAULT_RETURN_TO;

const returnToCookie = (cookies: string): string => returnTo(getDecodedCookie(FEIDE_RETURN_TO_COOKIE, cookies));

const oidcConfig = () => getFeideOidcConfig(config.feideClientId);

const originOf = (req: Request): string => `${config.isProduction ? "https" : "http"}://${req.get("host")}`;

const clearHandshakeCookies = (res: Response) => {
  res.clearCookie(FEIDE_PKCE_CODE_COOKIE, handshakeOptions);
  res.clearCookie(FEIDE_STATE_COOKIE, handshakeOptions);
  res.clearCookie(FEIDE_NONCE_COOKIE, handshakeOptions);
  res.clearCookie(FEIDE_RETURN_TO_COOKIE, handshakeOptions);
};

const router = express.Router();

router.use(["/login", "/logout"], (_req: Request, res: Response, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/login", async (req: Request, res: Response) => {
  try {
    const handshake = await startFeideLogin(await oidcConfig(), {
      redirectUri: `${originOf(req)}/login/success`,
    });

    res.cookie(FEIDE_STATE_COOKIE, handshake.state, handshakeOptions);
    res.cookie(FEIDE_PKCE_CODE_COOKIE, handshake.codeVerifier, handshakeOptions);
    res.cookie(FEIDE_NONCE_COOKIE, handshake.nonce, handshakeOptions);
    res.cookie(FEIDE_RETURN_TO_COOKIE, returnTo(req.query.returnTo), handshakeOptions);
    res.redirect(handshake.authorizationUrl);
  } catch (error) {
    log.error("Could not start the Feide login flow", error);
    res.status(500).send({ error: "Could not start the Feide login flow" });
  }
});

router.get("/login/success", async (req: Request, res: Response) => {
  const cookies = req.headers.cookie ?? "";
  const codeVerifier = getCookie(FEIDE_PKCE_CODE_COOKIE, cookies);
  const state = getCookie(FEIDE_STATE_COOKIE, cookies);
  const nonce = getCookie(FEIDE_NONCE_COOKIE, cookies);
  const redirectTo = returnToCookie(cookies);

  if (!req.query.code || !codeVerifier || !state || !nonce) {
    clearHandshakeCookies(res);
    res.status(400).send({ error: "Missing code, state, nonce or verifier" });
    return;
  }

  if (req.query.state !== state) {
    clearHandshakeCookies(res);
    res.status(400).send({ error: "State does not match" });
    return;
  }

  try {
    const tokens = await completeFeideLogin(await oidcConfig(), {
      currentUrl: `${originOf(req)}${req.url}`,
      codeVerifier,
      state,
      nonce,
    });

    clearHandshakeCookies(res);

    try {
      await upsertMyNdlaUser({
        apiUrl: config.apiDomain,
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
      });
    } catch (error) {
      log.error("Failed to create or update the MyNDLA user", error);
    }

    res.cookie(FEIDE_ID_TOKEN_COOKIE, tokens.id_token, {
      ...idTokenOptions,
      expires: feideTokenExpiry(tokens),
    });
    res.redirect(redirectTo);
  } catch (error) {
    log.error("Feide login failed", error);
    clearHandshakeCookies(res);
    res.status(500).send({ error: "Feide login failed" });
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  const redirectTo = returnTo(req.query.returnTo);
  const idToken = getCookie(FEIDE_ID_TOKEN_COOKIE, req.headers.cookie ?? "");

  res.clearCookie(FEIDE_ID_TOKEN_COOKIE, idTokenOptions);

  if (!idToken) {
    res.redirect(redirectTo);
    return;
  }

  try {
    res.cookie(FEIDE_RETURN_TO_COOKIE, redirectTo, handshakeOptions);
    res.redirect(
      buildFeideLogoutUrl(await oidcConfig(), {
        postLogoutRedirectUri: `${originOf(req)}/logout/session`,
        idToken,
      }),
    );
  } catch (error) {
    log.error("Could not end the Feide session", error);
    res.redirect(redirectTo);
  }
});

router.get("/logout/session", (req: Request, res: Response) => {
  const redirectTo = returnToCookie(req.headers.cookie ?? "");
  res.clearCookie(FEIDE_RETURN_TO_COOKIE, handshakeOptions);
  res.redirect(redirectTo);
});

export default router;
