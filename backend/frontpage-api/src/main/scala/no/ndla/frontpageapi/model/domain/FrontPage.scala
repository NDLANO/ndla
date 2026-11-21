/*
 * Part of NDLA frontpage-api
 * Copyright (C) 2018 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.frontpageapi.model.domain

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.*
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.frontpageapi.Props
import scalikejdbc.*

import scala.util.Try

case class Menu(articleId: Long, menu: List[Menu])
object Menu {
  implicit val encoder: Encoder[Menu] = deriveEncoder[Menu]
  implicit val decoder: Decoder[Menu] = deriveDecoder[Menu]
}

case class FrontPage(articleId: Long, menu: List[Menu])

object FrontPage {
  implicit val encoder: Encoder[FrontPage] = deriveEncoder[FrontPage]
  implicit val decoder: Decoder[FrontPage] = deriveDecoder[FrontPage]
}

class DBFrontPage(using props: Props) {

  object DBFrontPageData extends SQLSyntaxSupport[FrontPage] {
    override def tableName                  = "mainfrontpage"
    override def schemaName: Option[String] = Some(props.MetaSchema)

    def fromResultSet(lp: SyntaxProvider[FrontPage])(row: Row): Try[FrontPage] = fromResultSet(lp.resultName)(row)

    private def fromResultSet(lp: ResultName[FrontPage])(row: Row): Try[FrontPage] =
      row.required[FrontPage](lp.c("document"))(using ColumnDecoder.json)

  }
}
