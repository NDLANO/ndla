/*
 * Part of NDLA common
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common

import io.circe.syntax.EncoderOps
import io.circe.{Decoder, Encoder}
import no.ndla.common.implicits.*

import java.time.{LocalDateTime, ZoneOffset}
import java.time.format.{DateTimeFormatter, DateTimeParseException}
import scala.util.Try

object DateParser {
  private val formatter                              = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
  private val formatterWithoutMillis                 = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")
  def fromString(str: String): Option[LocalDateTime] = Try(LocalDateTime.parse(str, formatterWithoutMillis))
    .getOrElse(LocalDateTime.parse(str, formatter))
    .toOption
  def fromUnixTime(timestamp: Long): Option[LocalDateTime] = {
    LocalDateTime.ofEpochSecond(timestamp, 0, ZoneOffset.UTC).toOption
  }
  def dateToString(datetime: LocalDateTime, withMillis: Boolean): Option[String] = {
    val f =
      if (withMillis) formatter
      else formatterWithoutMillis
    datetime.format(f).toOption
  }

  def decoderWithFormat(fmt: String): Decoder[LocalDateTime] = {
    val format = DateTimeFormatter.ofPattern(fmt)
    Decoder[String].emapTry(str =>
      Try(LocalDateTime.parse(str, format)).flatMap(
        _.toOption.toTry(new DateTimeParseException(s"Could not parse '$str' with format '$fmt'", str, 0))
      )
    )
  }

  object Circe {
    implicit val localDateTimeDecoder: Decoder[LocalDateTime] = decoderWithFormat("yyyy-MM-dd'T'HH:mm:ss'Z'") or
      decoderWithFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") or
      decoderWithFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS'Z'") or
      decoderWithFormat("yyyy-MM-dd'T'HH:mm:ss") or
      decoderWithFormat("yyyy-MM-dd'T'HH:mm:ss.SSS") or
      decoderWithFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS")

    implicit val localDateTimeEncoder: Encoder[LocalDateTime] =
      Encoder.instance(x => DateParser.dateToString(x, withMillis = false).asJson)
  }
}
