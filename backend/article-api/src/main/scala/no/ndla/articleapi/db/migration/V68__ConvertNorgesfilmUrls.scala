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

class V68__ConvertNorgesfilmUrls extends HtmlMigration {
  override val convertVisualElement: Boolean                        = true
  override def convertHtml(doc: Element, language: String): Element = {
    doc
      .select("ndlaembed[data-resource='iframe'][data-url^='https://ndla.filmiundervisning.no']")
      .nn
      .forEach(embed => {
        val url = embed.nn.attr("data-url").nn
        embed.nn.attr("data-url", convertNorgesfilmUrl(url)): Unit
      })
    doc
      .select("a[href^='https://ndla.filmiundervisning.no']")
      .nn
      .forEach(link => {
        val url = link.nn.attr("href").nn
        link.nn.attr("href", convertNorgesfilmUrl(url)): Unit
      })
    doc
  }

  private def convertNorgesfilmUrl(url: String): String = {
    url.replace("ndla.", "ndla2.").nn.replace("/ndlafilm.aspx?filmId=", "/").nn
  }
}
