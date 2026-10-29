/*
 * Part of NDLA common
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.model.api

import sttp.tapir.{Codec, CodecFormat, DecodeResult, Schema}
import io.circe.{Decoder, Encoder, HCursor}
import io.circe.syntax.*
import no.ndla.common.implicits.toOption

abstract class StringBasedValue(val value: String) extends Comparable[StringBasedValue] {
  override def equals(obj: Any): Boolean = {
    obj match {
      case that: StringBasedValue => this.value == that.value
      case _                      => false
    }
  }
  override def hashCode(): Int                                = value.hashCode()
  override def compareTo(other: StringBasedValue | Null): Int = this.value.compareTo(other.toOption.map(_.value).orNull)
  override def toString: String                               = value
}

object StringBasedValue {
  implicit def schema[T <: StringBasedValue]: Schema[T] = Schema.string

  implicit def codec[T <: StringBasedValue](constructor: String => T): Codec[String, T, CodecFormat.TextPlain] = Codec
    .string
    .mapDecode { value =>
      DecodeResult.Value(constructor(value))
    }(_.toString)

  implicit def encoder[T <: StringBasedValue]: Encoder[T] = Encoder.instance { obj =>
    obj.toString.asJson
  }

  implicit def decoder[T <: StringBasedValue](constructor: String => T): Decoder[T] =
    (c: HCursor) => c.as[String].map(constructor)
}
