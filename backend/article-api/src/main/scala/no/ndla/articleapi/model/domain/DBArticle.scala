/*
 * Part of NDLA article-api
 * Copyright (C) 2016 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.articleapi.model.domain

import no.ndla.articleapi.Props
import no.ndla.common.model.domain.article.Article
import no.ndla.database.{ColumnDecoder, ColumnName, Row}
import scalikejdbc.*

import scala.util.Try

class DBArticle(using props: Props) {
  object Article extends SQLSyntaxSupport[Article] {

    override def tableName                  = "contentdata"
    override def schemaName: Option[String] = Some(props.MetaSchema)

    def fromResultSet(a: SyntaxProvider[Article])(row: Row): Try[ArticleRow] = fromResultSet(a.resultName)(row)

    def fromResultSet(a: ResultName[Article])(row: Row): Try[ArticleRow] = for {
      articleId   <- row.required[Long](a.c("article_id"))
      externalIds <- externalIdsFromRow(a.c("external_id"))(row)
      rowId       <- row.required[Long](a.c("id"))
      document    <- row.optional[Article](a.c("document"))(using ColumnDecoder.json)
      revision    <- row.required[Int](a.c("revision"))
      slug        <- row.optional[String](a.c("slug"))
    } yield ArticleRow(
      rowId = rowId,
      externalIds = externalIds,
      revision = revision,
      articleId = articleId,
      slug = slug,
      article = document.map(_.copy(id = Some(articleId), revision = Some(revision), slug = slug)),
    )

    def externalIdsFromRow(column: ColumnName)(row: Row): Try[Option[List[String]]] = row
      .optional[List[Option[String]]](column)
      .map(_.map(_.flatten).filter(_.nonEmpty))
  }
}
