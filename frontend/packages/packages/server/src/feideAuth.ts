/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MyNDLAUserDTO, paths } from "@ndla/types-backend/myndla-api";
import createClient from "openapi-fetch";
import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  buildEndSessionUrl,
  calculatePKCECodeChallenge,
  type Configuration,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type TokenEndpointResponse,
  type TokenEndpointResponseHelpers,
} from "openid-client";

export const FEIDE_DISCOVERY_URL = "https://auth.dataporten.no/.well-known/openid-configuration";

export const FEIDE_SCOPES =
  "email openid profile userinfo-photo groups-edu userinfo-language userid userinfo-name groups-org userid-feide";

export type FeideTokens = TokenEndpointResponse & TokenEndpointResponseHelpers & { id_token: string };

const configCache = new Map<string, Promise<Configuration>>();

export const getFeideOidcConfig = (
  clientId: string,
  discoveryUrl: string = FEIDE_DISCOVERY_URL,
): Promise<Configuration> => {
  const key = `${discoveryUrl} ${clientId}`;
  const cached = configCache.get(key);
  if (cached) return cached;

  const pending = discovery(new URL(discoveryUrl), clientId).catch((error: unknown) => {
    configCache.delete(key);
    throw error;
  });
  configCache.set(key, pending);
  return pending;
};

export interface FeideLoginHandshake {
  authorizationUrl: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface StartFeideLoginOptions {
  redirectUri: string;
  scope?: string;
  loginHint?: string;
}

export const startFeideLogin = async (
  config: Configuration,
  { redirectUri, scope = FEIDE_SCOPES, loginHint }: StartFeideLoginOptions,
): Promise<FeideLoginHandshake> => {
  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  const state = randomState();
  const nonce = randomNonce();

  const parameters: Record<string, string> = {
    redirect_uri: redirectUri,
    scope,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  };
  if (loginHint) parameters.login_hint = loginHint;

  return { authorizationUrl: buildAuthorizationUrl(config, parameters).toString(), state, nonce, codeVerifier };
};

export interface CompleteFeideLoginOptions {
  currentUrl: URL | string;
  codeVerifier: string;
  state: string;
  nonce: string;
}

export const completeFeideLogin = (
  config: Configuration,
  { currentUrl, codeVerifier, state, nonce }: CompleteFeideLoginOptions,
): Promise<FeideTokens> =>
  authorizationCodeGrant(config, new URL(currentUrl), {
    pkceCodeVerifier: codeVerifier,
    idTokenExpected: true,
    expectedState: state,
    expectedNonce: nonce,
  }) as Promise<FeideTokens>;

export interface FeideLogoutOptions {
  postLogoutRedirectUri: string;
  idToken?: string;
}

export const buildFeideLogoutUrl = (
  config: Configuration,
  { postLogoutRedirectUri, idToken }: FeideLogoutOptions,
): string => {
  const parameters: Record<string, string> = { post_logout_redirect_uri: postLogoutRedirectUri };
  if (idToken) parameters.id_token_hint = idToken;
  return buildEndSessionUrl(config, parameters).toString();
};

export const feideTokenExpiry = (tokens: FeideTokens): Date | undefined => {
  const exp = tokens.claims()?.exp;
  return typeof exp === "number" ? new Date(exp * 1000) : undefined;
};

export interface UpsertMyNdlaUserOptions {
  apiUrl: string;
  idToken: string;
  accessToken: string;
}

export const upsertMyNdlaUser = async ({
  apiUrl,
  idToken,
  accessToken,
}: UpsertMyNdlaUserOptions): Promise<MyNDLAUserDTO> => {
  const { data, error, response } = await createClient<paths>({ baseUrl: apiUrl }).PUT("/myndla-api/v1/users", {
    headers: { FeideAuthorization: `Bearer ${idToken}` },
    body: { accessToken },
  });
  if (error || !data) throw new Error(`Upserting the MyNDLA user failed with status ${response.status}`);
  return data;
};
