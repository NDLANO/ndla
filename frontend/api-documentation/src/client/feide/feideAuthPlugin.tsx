/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentType, ReactNode } from "react";
import type { AuthsProps } from "../swaggerUiTypes.js";
import { FEIDE_SCHEME_NAME } from "./authorize.js";
import { FeideSection } from "./FeideSection.js";

export const feideAuthPlugin = {
  wrapComponents: {
    auths:
      (Original: ComponentType<AuthsProps>) =>
      (props: AuthsProps): ReactNode => {
        const schema = props.definitions?.get(FEIDE_SCHEME_NAME);
        if (!props.definitions || !schema) {
          return <Original {...props} />;
        }
        const withoutFeide = { ...props, definitions: props.definitions.delete(FEIDE_SCHEME_NAME) };
        return (
          <div>
            <FeideSection authProps={props} schema={schema} />
            <Original {...withoutFeide} />
          </div>
        );
      },
  },
};
