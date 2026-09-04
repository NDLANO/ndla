/*
 * Part of NDLA image-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.model.domain

import enumeratum.{Enum, EnumEntry}
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import no.ndla.common.CirceUtil.CirceEnumWithErrors
import sttp.tapir.Schema
import sttp.tapir.codec.enumeratum.*

case class ImageVariant(size: ImageVariantSize, bucketKey: String) {
  def sizeName: String = size.entryName
}

object ImageVariant {
  def bucketKeyPrefixFor(fileName: String): String = s"$fileName/"

  def bucketKeyFor(fileName: String, size: ImageVariantSize): String =
    s"${bucketKeyPrefixFor(fileName)}${size.entryName}.webp"

  def fromFileName(fileName: String, size: ImageVariantSize) = ImageVariant(size, bucketKeyFor(fileName, size))

  implicit val encoder: Encoder[ImageVariant] = deriveEncoder[ImageVariant]
  implicit val decoder: Decoder[ImageVariant] = deriveDecoder[ImageVariant]
}

sealed abstract class ImageVariantSize(override val entryName: String, val width: Int) extends EnumEntry

object ImageVariantSize extends Enum[ImageVariantSize], CirceEnumWithErrors[ImageVariantSize] {
  case object Icon            extends ImageVariantSize("icon", 240)
  case object ExtraSmall      extends ImageVariantSize("xsmall", 480)
  case object Small           extends ImageVariantSize("small", 800)
  case object Medium          extends ImageVariantSize("medium", 1080)
  case object Large           extends ImageVariantSize("large", 1440)
  case object ExtraLarge      extends ImageVariantSize("xlarge", 1920)
  case object ExtraExtraLarge extends ImageVariantSize("xxlarge", 2560)

  /** Finds the variant sizes for the given `dimensions`. Returns a list of all sizes narrower than the given
    * dimensions, plus the first size that is wider (if it exists). The widest size will be the image's native
    * resolution.
    */
  def forDimensions(dimensions: ImageDimensions): Seq[ImageVariantSize] = {
    val (narrower, rest) = values.span(_.width < dimensions.width)
    narrower ++ rest.take(1)
  }

  override def values: IndexedSeq[ImageVariantSize] = findValues

  implicit def schema: Schema[ImageVariantSize] = schemaForEnumEntry[ImageVariantSize]
}
