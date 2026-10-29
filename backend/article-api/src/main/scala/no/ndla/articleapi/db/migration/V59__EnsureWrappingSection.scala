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

class V59__EnsureWrappingSection extends HtmlMigration {
  override def convertHtml(doc: Element, language: String): Element = {
    if (doc.select("body > section").nn.isEmpty) {
      val body    = doc.select("body").nn.first().nn
      val section = new Element("section").appendChildren(body.children())
      body.appendChild(section)
      doc
    } else {
      doc
    }
  }
}
