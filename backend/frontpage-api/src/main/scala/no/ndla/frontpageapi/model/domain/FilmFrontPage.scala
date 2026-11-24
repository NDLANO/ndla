/*
 * Part of NDLA frontpage-api
 * Copyright (C) 2019 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.frontpageapi.model.domain

import io.circe.generic.semiauto.*
import io.circe.{Decoder, Encoder}
import no.ndla.common.model.domain.frontpage.{AboutSubject, MovieTheme}
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.frontpageapi.Props
import no.ndla.language.Language.getSupportedLanguages
import scalikejdbc.*

import scala.util.Try

case class FilmFrontPage(
    name: String,
    about: Seq[AboutSubject],
    movieThemes: Seq[MovieTheme],
    slideShow: Seq[String],
    article: Option[String],
) {

  def supportedLanguages: Seq[String] = getSupportedLanguages(about, movieThemes.flatMap(_.name))
}

object FilmFrontPage {
  implicit val decoder: Decoder[FilmFrontPage] = deriveDecoder
  implicit val encoder: Encoder[FilmFrontPage] = deriveEncoder
}

class DBFilmFrontPage(using props: Props) {

  object DBFilmFrontPageData extends SQLSyntaxSupport[FilmFrontPage] {
    override def tableName                  = "filmfrontpage"
    override def schemaName: Option[String] = Some(props.MetaSchema)

    def fromDb(lp: SyntaxProvider[FilmFrontPage])(row: Row): Try[FilmFrontPage] = fromDb(lp.resultName)(row)

    private def fromDb(lp: ResultName[FilmFrontPage])(row: Row): Try[FilmFrontPage] =
      row.required[FilmFrontPage](lp.c("document"))(using ColumnDecoder.json)

  }
}
