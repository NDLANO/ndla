/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.api

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import sttp.tapir.Schema.annotations.description

@description("A single answer alternative for SINGLE_CHOICE or MULTI_CHOICE questions")
case class AlternativeDTO(
    @description("Unique identifier for the alternative")
    id: String,
    @description("Answer text")
    text: String,
    @description("Whether this alternative is correct (visible to the owner only)")
    isCorrect: Option[Boolean],
)
object AlternativeDTO {
  implicit val encoder: Encoder[AlternativeDTO] = deriveEncoder
  implicit val decoder: Decoder[AlternativeDTO] = deriveDecoder
}

@description("Input for creating an alternative")
case class NewAlternativeDTO(
    @description("Answer text")
    text: String,
    @description("Whether this alternative is correct")
    isCorrect: Boolean,
)
object NewAlternativeDTO {
  implicit val encoder: Encoder[NewAlternativeDTO] = deriveEncoder
  implicit val decoder: Decoder[NewAlternativeDTO] = deriveDecoder
}
