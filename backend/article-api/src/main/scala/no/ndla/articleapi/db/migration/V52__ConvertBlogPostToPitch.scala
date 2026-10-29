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

class V52__ConvertBlogPostToPitch extends HtmlMigration {
  override val convertVisualElement: Boolean                        = false
  override def convertHtml(doc: Element, language: String): Element = {
    doc
      .select("ndlaembed[data-resource='blog-post']")
      .nn
      .forEach(embed => {
        embed.nn.attr("data-resource", "pitch")
        embed.nn.attr("data-description", "")
        embed.nn.removeAttr("data-size"): Unit
        embed.nn.removeAttr("data-author"): Unit
      })
    doc
  }
}
