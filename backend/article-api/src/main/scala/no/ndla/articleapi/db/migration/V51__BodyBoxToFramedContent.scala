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

class V51__BodyBoxToFramedContent extends HtmlMigration {
  override val convertVisualElement: Boolean                        = false
  override def convertHtml(doc: Element, language: String): Element = {
    doc
      .select("div.c-bodybox")
      .nn
      .forEach(div => {
        div.nn.removeClass("c-bodybox")
        div.nn.attr("data-type", "framed-content"): Unit
      })
    doc
  }
}
