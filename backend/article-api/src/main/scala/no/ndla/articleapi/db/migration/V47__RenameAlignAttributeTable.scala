/*
 * Part of NDLA article-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.articleapi.db.migration

import io.circe.parser
import org.flywaydb.core.api.migration.{BaseJavaMigration, Context}
import org.jsoup.Jsoup
import org.jsoup.nodes.Entities.EscapeMode
import org.postgresql.util.PGobject
import scalikejdbc.{DB, DBSession, *}

import scala.collection.Seq

class V47__RenameAlignAttributeTable extends BaseJavaMigration {

  private def countAllRows(implicit session: DBSession): Option[Long] = {
    sql"select count(*) from contentdata where document is not NULL".map(rs => rs.long("count")).single()
  }

  private def allRows(offset: Long)(implicit session: DBSession): Seq[(Long, String)] = {
    sql"select id, document, article_id from contentdata where document is not null order by id limit 1000 offset $offset"
      .map(rs => {
        (rs.long("id"), rs.string("document"))
      })
      .list()
  }

  private def updateRow(document: String, id: Long)(implicit session: DBSession): Int = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(document)

    sql"update contentdata set document = $dataObject where id = $id".update()
  }

  override def migrate(context: Context | Null): Unit = DB(context.nn.getConnection.nn)
    .autoClose(false)
    .withinTx { session =>
      migrateRows(using session)
    }

  private def migrateRows(implicit session: DBSession): Unit = {
    val count        = countAllRows.get
    var numPagesLeft = (count / 1000) + 1
    var offset       = 0L

    while (numPagesLeft > 0) {
      allRows(offset * 1000).map { case (id, document) =>
        updateRow(convertDocument(document), id)
      }: Unit
      numPagesLeft -= 1
      offset += 1
    }
  }

  private def convertHtml(str: String): String = {
    val document = Jsoup.parseBodyFragment(str).nn
    document.outputSettings().nn.escapeMode(EscapeMode.xhtml).nn.prettyPrint(false).nn.indentAmount(0)

    document
      .select("td[align],th[align]")
      .nn
      .forEach(cell => {
        val attributeValue = cell.nn.attr("align")
        cell.nn.attr("data-align", attributeValue): Unit
        cell.nn.removeAttr("align"): Unit
      })

    document.select("td[valign],th[valign]").nn.forEach(cell => cell.nn.removeAttr("valign"): Unit)

    val result = document.select("body").nn.first().nn.html().nn
    result
  }

  private[migration] def convertDocument(document: String): String = {
    val oldArticle = parser.parse(document).toTry.get
    val cursor     = oldArticle.hcursor

    if (cursor.downField("content").focus.isEmpty) {
      document
    } else {
      val newJson = oldArticle
        .hcursor
        .downField("content")
        .withFocus(f => {
          f.mapArray(contents => {
            contents.map { content =>
              content.mapObject(f => f.mapValues(str => str.mapString(s => convertHtml(s))))
            }
          })

        })
      newJson.top.get.noSpaces
    }
  }
}
