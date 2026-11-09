/*
 * Part of NDLA image-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.service

import com.sksamuel.scrimage.metadata.ImageMetadata
import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.implicits.toOption

import java.io.InputStream
import scala.util.Try

object ExifUtil extends StrictLogging {

  // Common EXIF date/time tags to check for when extracting the original capture date
  private val ExifDateTimeOriginal = "Exif SubIFD:Date/Time Original"
  private val ExifDateTime         = "Exif IFD0:Date/Time"

  def extractDate(exifData: Option[Map[String, String]]): Option[String] =
    if (exifData.isEmpty) {
      None
    } else {
      exifData.flatMap(data => data.get(ExifDateTimeOriginal).orElse(data.get(ExifDateTime)).orElse(None))
    }

  /** Extracts all EXIF key-value pairs from an ImageMetadata.
    */
  def extractMetadataMap(metadata: ImageMetadata): Option[Map[String, String]] = {
    val values = (
      for {
        directories <- metadata.getDirectories.toOption.toList
        directory   <- directories.toList.flatMap(_.toOption)
        tags        <- directory.getTags.toOption.toList
        tag         <- tags.toList.flatMap(_.toOption)
        value       <- tag.getRawValue.toOption
        if value.nonEmpty
      } yield s"${directory.getName}:${tag.getName}" -> value
    ).toMap
    if (values.isEmpty) None
    else Some(values)
  }

  /** Extracts all EXIF key-value pairs from an InputStream.
    */
  def extractExifDataFromStream(stream: InputStream): Option[Map[String, String]] = {
    Try {
      ImageMetadata.fromStream(stream).toOption.flatMap(extractMetadataMap)
    }.recover { case ex =>
        logger.warn(s"Failed to extract EXIF data from stream: ${ex.getMessage}", ex)
        None
      }
      .getOrElse(None)
  }
}
