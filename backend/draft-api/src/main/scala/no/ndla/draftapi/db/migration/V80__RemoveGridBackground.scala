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

class V80__RemoveGridBackground extends HtmlMigration {
  override def convertHtml(doc: Element, language: String): Element = {
    doc
      .select("div[data-type='grid'][data-background]")
      .nn
      .asScala
      .foreach(embed => {
        val _ = embed.removeAttr("data-background")
      })
    doc
  }
}
