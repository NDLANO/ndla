/*
 * Part of NDLA audio-api
 * Copyright (C) 2016 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.audioapi.model.domain

import sttp.tapir.Schema
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.article.Copyright
import no.ndla.common.model.domain.{Tag, Title}
import no.ndla.audioapi.Props
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.language.Language.getSupportedLanguages
import no.ndla.language.model.LanguageField
import scalikejdbc.*
import no.ndla.common.DeriveHelpers

import scala.util.Try

case class AudioMetaInformation(
    id: Option[Long],
    revision: Option[Int],
    titles: Seq[Title],
    filePaths: Seq[Audio],
    copyright: Copyright,
    tags: Seq[Tag],
    updatedBy: String,
    updated: NDLADate,
    created: NDLADate,
    podcastMeta: Seq[PodcastMeta],
    audioType: AudioType.Value = AudioType.Standard,
    manuscript: Seq[Manuscript],
    seriesId: Option[Long],
    series: Option[Series],
    released: NDLADate,
) {
  lazy val supportedLanguages: Seq[String] = getSupportedLanguages(titles, podcastMeta, manuscript, filePaths, tags)
}

object AudioType extends Enumeration {
  val Standard: this.Value = Value("standard")
  val Podcast: this.Value  = Value("podcast")

  def all: Seq[String]                       = this.values.map(_.toString).toSeq
  def valueOf(s: String): Option[this.Value] = this.values.find(_.toString == s)

  implicit val audioTypeEnc: Encoder[AudioType.Value] = Encoder.encodeEnumeration(AudioType)
  implicit val audioTypeDec: Decoder[AudioType.Value] = Decoder.decodeEnumeration(AudioType)
}

case class Manuscript(manuscript: String, language: String) extends LanguageField[String] {
  override def value: String    = manuscript
  override def isEmpty: Boolean = manuscript.isEmpty
}

object Manuscript {
  implicit val encoder: Encoder[Manuscript] = deriveEncoder
  implicit val decoder: Decoder[Manuscript] = deriveDecoder
}
case class Audio(filePath: String, mimeType: String, fileSize: Long, language: String) extends LanguageField[Audio] {
  override def value: Audio     = this
  override def isEmpty: Boolean = false
}

object Audio {
  implicit val encoder: Encoder[Audio] = deriveEncoder
  implicit val decoder: Decoder[Audio] = deriveDecoder
}

object AudioMetaInformation {

  implicit val encoder: Encoder[AudioMetaInformation] = deriveEncoder
  implicit val decoder: Decoder[AudioMetaInformation] = deriveDecoder
  import sttp.tapir.generic.auto.*
  implicit def schema: Schema[AudioMetaInformation] = DeriveHelpers.getSchema

  def fromResultSet(au: SyntaxProvider[AudioMetaInformation])(row: Row): Try[AudioMetaInformation] =
    fromResultSet(au.resultName)(row)

  def fromResultSet(au: ResultName[AudioMetaInformation])(row: Row): Try[AudioMetaInformation] = for {
    meta     <- row.required[AudioMetaInformation](au.c("document"))(using ColumnDecoder.json)
    id       <- row.required[Long](au.c("id"))
    revision <- row.required[Int](au.c("revision"))
    seriesId <- row.optional[Long](au.c("series_id"))
  } yield meta.copy(id = Some(id), revision = Some(revision), seriesId = seriesId)
}

class DBAudioMetaInformation(using props: Props) extends SQLSyntaxSupport[AudioMetaInformation] {
  override def tableName: String          = "audiodata"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}
