/*
 * Part of NDLA draft-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.draftapi.db.migration

import no.ndla.draftapi.db.HtmlMigration
import org.jsoup.nodes.Element

import scala.jdk.CollectionConverters.*

class V82__ConvertNorgesfilmUrls extends HtmlMigration {
  override val convertVisualElement: Boolean                        = true
  override def convertHtml(doc: Element, language: String): Element = {
    doc
      .select("ndlaembed[data-resource='iframe'][data-url^='https://ndla.filmiundervisning.no']")
      .nn
      .asScala
      .foreach(embed => {
        val url = embed.attr("data-url")
        embed.attr("data-url", convertNorgesfilmUrl(url.nn)): Unit
      })
    doc
      .select("a[href^='https://ndla.filmiundervisning.no']")
      .nn
      .asScala
      .foreach(link => {
        val url = link.attr("href")
        link.attr("href", convertNorgesfilmUrl(url.nn)): Unit
      })
    doc
  }

  private def convertNorgesfilmUrl(url: String): String = {
    url.replace("ndla.", "ndla2.").nn.replace("/ndlafilm.aspx?filmId=", "/").nn
  }

}
