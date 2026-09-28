/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MissingRouterContext } from "@ndla/safelink";
import { Outlet } from "react-router";
import { ErrorElement } from "../RouteErrorElement";

const IframeLayout = () => (
  <MissingRouterContext value={true}>
    <Outlet />
  </MissingRouterContext>
);

export default IframeLayout;

export const ErrorBoundary = () => (
  <MissingRouterContext value={true}>
    <ErrorElement />
  </MissingRouterContext>
);
