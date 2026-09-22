/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getHtmlLang } from "../../i18n";
import { iframeArticleRoutes } from "../../iframe/iframeArticleRoutes";
import type { RenderFunc } from "../serverHelpers";
import { renderPage } from "./renderPage";

export const iframeArticleRender: RenderFunc = async (req, chunkInfo) => {
  const lang = typeof req.params.lang === "string" ? req.params.lang : undefined;
  const locale = getHtmlLang(lang);
  const { articleId, taxonomyId } = req.params;

  return renderPage({
    req,
    routes: iframeArticleRoutes,
    chunkInfo,
    locale,
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
