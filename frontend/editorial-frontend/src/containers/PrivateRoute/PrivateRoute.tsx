/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type JSX, useEffect } from "react";
import { useHref, useLocation } from "react-router";
import { toLogin } from "../../util/routeHelpers";
import { useSession } from "../Session/SessionProvider";

interface Props {
  component: JSX.Element;
}

const PrivateRoute = ({ component }: Props) => {
  const { authenticated } = useSession();
  const location = useLocation();
  const href = useHref(location);

  useEffect(() => {
    if (!authenticated) {
      window.location.href = toLogin(encodeURIComponent(href));
    }
  }, [authenticated, href]);

  if (!authenticated) {
    return;
  }
  return component;
};

export default PrivateRoute;
