/*
 * Part of NDLA article-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.articleapi.db.migration

import no.ndla.articleapi.db.HtmlMigration
import org.jsoup.nodes.Element

class V60__InlineConceptLinkTextToChildren extends HtmlMigration {
  override def convertHtml(doc: Element, language: String): Element = {
    doc
      .select("ndlaembed[data-resource='concept'][data-link-text]")
      .nn
      .forEach(embed => {
        val linkText = embed.nn.attr("data-link-text")
        embed.nn.append(linkText)
        val _ = embed.nn.removeAttr("data-link-text")
      })
    doc
  }
}
