/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "../../config";
import { getHtmlLang, isValidLocale } from "../../i18n";
import { iframeArticleRoutes } from "../../iframe/iframeArticleRoutes";
import type { LocaleType } from "../../interfaces";
import type { RenderFunc } from "../serverHelpers";
import { renderPage } from "./renderPage";

export const iframeArticleRender: RenderFunc = async (req, chunkInfo) => {
  const lang = typeof req.params.lang === "string" ? req.params.lang : undefined;
  const htmlLang = getHtmlLang(lang);
  const locale = isValidLocale(htmlLang) ? htmlLang : undefined;
  const { articleId, taxonomyId } = req.params;

  return renderPage({
    req,
    routes: iframeArticleRoutes,
    chunkInfo,
    locale: locale ?? (config.defaultLocale as LocaleType),
    missingRouter: true,
    data: {
      initialProps: {
        basename: lang,
        articleId,
        taxonomyId,
        locale,
      },
    },
  });
};
