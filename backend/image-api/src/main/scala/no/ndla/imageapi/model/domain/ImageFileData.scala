/*
 * Part of NDLA image-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.model.domain

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.language.model.WithLanguage

case class ImageFileData(
    fileName: String,
    size: Long,
    contentType: ImageContentType,
    dimensions: Option[ImageDimensions],
    variants: Seq[ImageVariant],
    originalDate: Option[String],
    override val language: String,
) extends WithLanguage {
  // TODO: Remove after old image variants with file stem are removed
  def getFileStem: String = {
    fileName.lastIndexOf(".") match {
      case i if i > 0 => fileName.substring(0, i)
      case _          => fileName
    }
  }

  def expectedVariants: Seq[ImageVariant] = dimensions
    .toSeq
    .flatMap(ImageVariantSize.forDimensions)
    .map(size => ImageVariant.fromFileName(fileName, size))
}

object ImageFileData {
  implicit val encoder: Encoder[ImageFileData] = deriveEncoder
  implicit val decoder: Decoder[ImageFileData] = deriveDecoder
}
