/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AuthActions, SwaggerSystem } from "../swaggerUiTypes.js";
import { feideToken } from "./feideToken.js";
import { runInPopup } from "./popup.js";

export const FEIDE_SCHEME_NAME = "FeideAuth";

let swaggerSystem: SwaggerSystem | undefined;

const preauthorize = (system: SwaggerSystem, token: string): void =>
  system.preauthorizeApiKey(FEIDE_SCHEME_NAME, `Bearer ${token}`);

export const attachFeideAuth = (system: SwaggerSystem): void => {
  swaggerSystem = system;
  const token = feideToken();
  if (token) preauthorize(system, token);
};

export const loginWithFeide = (): void =>
  runInPopup(
    "/login",
    () => !!feideToken(),
    () => {
      const token = feideToken();
      if (swaggerSystem && token) preauthorize(swaggerSystem, token);
    },
  );

export const logoutFromFeide = (authActions: AuthActions): void =>
  runInPopup(
    "/logout",
    () => !feideToken(),
    () => authActions.logout([FEIDE_SCHEME_NAME]),
  );
