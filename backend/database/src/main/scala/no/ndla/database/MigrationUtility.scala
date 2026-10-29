/*
 * Part of NDLA database
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import no.ndla.common.implicits.toOption
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import org.jsoup.nodes.Entities.EscapeMode

object MigrationUtility {

  def stringToJsoupDocument(htmlString: String): Option[Element] = Jsoup
    .parseBodyFragment(htmlString)
    .toOption
    .flatMap { document =>
      document.outputSettings().toOption.flatMap(_.escapeMode(EscapeMode.xhtml).toOption).foreach(_.prettyPrint(false))
      document.select("body").toOption.flatMap(_.first().toOption)
    }

  def jsoupDocumentToString(element: Element): Option[String] = element
    .select("body")
    .toOption
    .flatMap(_.html().toOption)
}
