/*
 * Part of NDLA audio-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.audioapi.model.domain

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.Title
import no.ndla.audioapi.Props
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.language.Language.getSupportedLanguages
import scalikejdbc.*

import scala.util.Try

/** Base series without database generated fields */
case class SeriesWithoutId(
    title: Seq[Title],
    coverPhoto: CoverPhoto,
    episodes: Option[Seq[AudioMetaInformation]],
    updated: NDLADate,
    created: NDLADate,
    description: Seq[Description],
    hasRSS: Boolean,
)
object SeriesWithoutId {
  implicit val encoder: Encoder[SeriesWithoutId] = deriveEncoder
  implicit val decoder: Decoder[SeriesWithoutId] = deriveDecoder
}

/** Series with database generated fields. Should match [[SeriesWithoutId]] exactly except for the fields added when
  * inserting into database.
  */
case class Series(
    id: Long,
    revision: Int,
    episodes: Option[Seq[AudioMetaInformation]],
    title: Seq[Title],
    coverPhoto: CoverPhoto,
    updated: NDLADate,
    created: NDLADate,
    description: Seq[Description],
    hasRSS: Boolean,
) {
  lazy val supportedLanguages: Seq[String] = getSupportedLanguages(title, description)
  def withoutId: SeriesWithoutId           = SeriesWithoutId(
    title = title,
    coverPhoto = coverPhoto,
    episodes = episodes,
    updated = updated,
    created = created,
    description = description,
    hasRSS = hasRSS,
  )
}

object Series {

  implicit val encoder: Encoder[Series] = deriveEncoder
  implicit val decoder: Decoder[Series] = deriveDecoder

  def fromId(id: Long, revision: Int, series: SeriesWithoutId): Series = {
    new Series(
      id = id,
      revision = revision,
      episodes = None,
      title = series.title,
      coverPhoto = series.coverPhoto,
      updated = series.updated,
      created = series.created,
      description = series.description,
      hasRSS = series.hasRSS,
    )
  }

  def fromResultSet(s: SyntaxProvider[Series])(row: Row): Try[Series] = fromResultSet(s.resultName)(row)

  def fromResultSet(s: ResultName[Series])(row: Row): Try[Series] = for {
    meta     <- row.required[SeriesWithoutId](s.c("document"))(using ColumnDecoder.json)
    id       <- row.required[Long](s.c("id"))
    revision <- row.required[Int](s.c("revision"))
  } yield fromId(id = id, revision = revision, series = meta)
}

class DBSeries(using props: Props) extends SQLSyntaxSupport[Series] {
  override def tableName: String          = "seriesdata"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}
