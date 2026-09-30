/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentType, ReactNode } from "react";
import type { AuthsProps, SecurityScheme } from "../swaggerUiTypes.js";
import { FEIDE_SCHEME_NAME, loginWithFeide, logoutFromFeide } from "./authorize.js";

interface Props {
  authProps: AuthsProps;
  schema: SecurityScheme;
  Button: ComponentType<Record<string, unknown>>;
  Markdown: ComponentType<Record<string, unknown>>;
}

export const FeideSection = ({ authProps, schema, Button, Markdown }: Props): ReactNode => {
  const authorized = authProps.authSelectors.authorized().get(FEIDE_SCHEME_NAME);

  return (
    <div className="auth-container">
      <h4>
        <code>{FEIDE_SCHEME_NAME}</code> (apiKey)
      </h4>
      {authorized ? <h6>Authorized</h6> : null}
      <Markdown source={schema.get("description")} />
      <p>
        Name: <code>{schema.get("name")}</code>
      </p>
      <p>
        In: <code>{schema.get("in")}</code>
      </p>
      <div className="auth-btn-wrapper">
        {authorized ? (
          <Button
            className="btn modal-btn auth authorize"
            onClick={() => logoutFromFeide(authProps.authActions)}
            aria-label="Log out of Feide"
          >
            Logout
          </Button>
        ) : (
          <Button className="btn modal-btn auth authorize" onClick={loginWithFeide} aria-label="Log in with Feide">
            Authorize
          </Button>
        )}
        <Button className="btn modal-btn auth btn-done" onClick={() => authProps.authActions.showDefinitions(false)}>
          Close
        </Button>
      </div>
    </div>
  );
};
