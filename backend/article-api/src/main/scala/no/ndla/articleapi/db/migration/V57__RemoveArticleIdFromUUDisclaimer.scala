/*
 * Part of NDLA article-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.articleapi.db.migration

import no.ndla.articleapi.db.HtmlMigration
import org.jsoup.nodes.Element

class V57__RemoveArticleIdFromUUDisclaimer extends HtmlMigration {
  override val convertVisualElement: Boolean                        = true
  override def convertHtml(doc: Element, language: String): Element = {
    doc
      .select("ndlaembed[data-resource='uu-disclaimer']")
      .nn
      .forEach(embed => {
        val hasArticleId = embed.nn.hasAttr("data-article-id")
        if (hasArticleId) {
          embed.nn.removeAttr("data-article-id"): Unit
        }
      })
    doc
  }
}
