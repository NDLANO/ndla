/*
 * Part of NDLA image-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.model.domain

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.{AiGenerated, Tag}
import no.ndla.common.model.domain.article.Copyright
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.imageapi.Props
import scalikejdbc.*

import scala.util.Try

case class ImageMetaInformation(
    id: Option[Long],
    titles: Seq[ImageTitle],
    alttexts: Seq[ImageAltText],
    images: Seq[ImageFileData],
    copyright: Copyright,
    tags: Seq[Tag],
    captions: Seq[ImageCaption],
    updatedBy: String,
    updated: NDLADate,
    created: NDLADate,
    createdBy: String,
    modelReleased: ModelReleasedStatus,
    editorNotes: Seq[EditorNote],
    inactive: Boolean,
    aiGenerated: Option[AiGenerated],
)

object ImageMetaInformation {

  implicit val encoder: Encoder[ImageMetaInformation] = deriveEncoder[ImageMetaInformation]
  implicit val decoder: Decoder[ImageMetaInformation] = deriveDecoder[ImageMetaInformation]

  def fromResultSet(im: SyntaxProvider[ImageMetaInformation])(row: Row): Try[ImageMetaInformation] =
    fromResultSet(im.resultName)(row)

  def fromResultSet(im: ResultName[ImageMetaInformation])(row: Row): Try[ImageMetaInformation] = for {
    id       <- row.required[Long](im.c("id").value)
    metadata <- row.required[ImageMetaInformation](im.c("metadata").value)(using ColumnDecoder.json)
  } yield metadata.copy(id = Some(id))
}

class DBImageMetaInformation(using props: Props) extends SQLSyntaxSupport[ImageMetaInformation] {
  override def tableName: String          = "imagemetadata"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}
