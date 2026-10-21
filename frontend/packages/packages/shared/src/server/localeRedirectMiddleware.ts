/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { RequestHandler } from "express";

/**
 * React Router matches paths case-insensitively, so `/NN/search` renders the `/nn/search` route while everything that
 * reads the locale from the path does not recognize `NN`. This permanently redirects such paths to the lowercase locale.
 */
export const createLocaleRedirectMiddleware = (locales: readonly string[]): RequestHandler => {
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const [, firstSegment = ""] = req.path.split("/");
    const locale = firstSegment.toLowerCase();
    if (firstSegment === locale || !locales.includes(locale)) return next();
    res.redirect(301, `/${locale}${req.url.slice(firstSegment.length + 1)}`);
  };
};
