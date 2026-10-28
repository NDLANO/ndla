/*
 * Part of NDLA learningpath-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.learningpathapi.db.migration

import io.circe.syntax.EncoderOps
import io.circe.parser
import no.ndla.common.model.domain.learningpath.EmbedUrl
import no.ndla.database.TableMigration
import scalikejdbc.*
import org.postgresql.util.PGobject

case class DocumentRow(id: Long, document: String)

class V55__AddArticleId extends TableMigration[DocumentRow] {
  val columnName: String         = "document"
  override val tableName: String = "learningsteps"
  val articleIdRegex             = """^(?:\/(?:nb|nn|en|se|sma))?\/article(?:-iframe)?\/?.*?\/(\d+)""".r

  private lazy val columnNameSQL: SQLSyntax = SQLSyntax.createUnsafely(columnName)
  override lazy val whereClause: SQLSyntax  = sqls"$columnNameSQL is not null"

  override def extractRowData(rs: WrappedResultSet): DocumentRow = DocumentRow(rs.long("id"), rs.string(columnName))

  def updateRow(rowData: DocumentRow)(implicit session: DBSession): Int = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    val newDocument = convertColumn(rowData.document)
    dataObject.setValue(newDocument)
    sql"""update $tableNameSQL
          set $columnNameSQL = $dataObject
          where id = ${rowData.id}
       """.update()
  }

  def convertColumn(value: String): String = {
    val oldDocument                 = parser.parse(value).toTry.get
    val embedUrl                    = oldDocument.hcursor.downField("embedUrl").as[Seq[EmbedUrl]].toTry.get
    val oldArticle                  = oldDocument.hcursor.downField("articleId").as[Option[Long]].toTry.getOrElse(None)
    val (newArticles, newEmbedUrls) = embedUrl.foldLeft((Set.empty[Long], Seq.empty[EmbedUrl]))((acc, url) =>
      articleIdRegex.findFirstMatchIn(url.url).flatMap(m => Option(m.group(1))).flatMap(_.toLongOption) match {
        case Some(articleId) => (acc._1 + articleId, acc._2)
        case None            => (acc._1, acc._2 :+ url)
      }
    )

    val newArticleId = newArticles.headOption.orElse(oldArticle)

    val newDocument = oldDocument
      .hcursor
      .withFocus(_.mapObject(_.remove("embedUrl").add("embedUrl", newEmbedUrls.asJson)))
      .withFocus(_.mapObject(_.remove("articleId").add("articleId", newArticleId.asJson)))

    newDocument.top.get.noSpaces
  }
}
