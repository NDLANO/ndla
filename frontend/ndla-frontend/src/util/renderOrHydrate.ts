/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from "react";
import { createRoot, hydrateRoot, type ErrorInfo } from "react-dom/client";
import { matchRoutes, type RouteObject } from "react-router";
import config from "../config";
import { ensureError, handleError } from "./handleError";
import { hadChunkReloadAttempt, isChunkLoadError, triggerCrashReload } from "./skewDetection";

const handleRootError = (phase: "hydration" | "render") => (error: unknown, errorInfo: ErrorInfo) =>
  handleError(ensureError(error), { phase, componentStack: errorInfo.componentStack });

/** Loads the modules for the lazy routes matching `path`, so they can render synchronously. */
const resolveLazyRoutes = async (routes: RouteObject[], path: string) => {
  const lazyMatches = matchRoutes(routes, path)?.filter((m) => m.route.lazy) ?? [];

  await Promise.all(
    lazyMatches.map(async (m) => {
      if (typeof m.route.lazy === "function") {
        const routeModule = await m.route.lazy();
        Object.assign(m.route, { ...routeModule, lazy: undefined });
      }
    }),
  );
};

export const renderOrHydrate = async (
  container: Element | Document,
  routes: RouteObject[],
  path: string,
  createTree: () => ReactNode,
) => {
  try {
    await resolveLazyRoutes(routes, path);
  } catch (error) {
    if (!isChunkLoadError(error) || hadChunkReloadAttempt()) throw error;
    triggerCrashReload();
    return;
  }

  const children = createTree();

  if (config.disableSSR) {
    const root = createRoot(container);
    root.render(children);
  } else {
    hydrateRoot(container, children, {
      onRecoverableError: handleRootError("hydration"),
      onUncaughtError: import.meta.env.PROD ? handleRootError("render") : undefined,
    });
  }
};
