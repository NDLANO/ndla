/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "../../config";
import { getHtmlLang, isValidLocale } from "../../i18n";
import { iframeEmbedRoutes } from "../../iframe/embedIframeRoutes";
import type { LocaleType } from "../../interfaces";
import type { RenderFunc } from "../serverHelpers";
import { renderPage } from "./renderPage";

export const iframeEmbedRender: RenderFunc = async (req, chunkInfo) => {
  const lang = typeof req.params.lang === "string" ? req.params.lang : undefined;
  const htmlLang = getHtmlLang(lang);
  const locale = isValidLocale(htmlLang) ? htmlLang : undefined;
  const { embedType, embedId } = req.params;

  return renderPage({
    req,
    routes: iframeEmbedRoutes,
    chunkInfo,
    locale: locale ?? (config.defaultLocale as LocaleType),
    missingRouter: true,
    data: {
      initialProps: { basename: lang, embedType, embedId, locale },
    },
  });
};
