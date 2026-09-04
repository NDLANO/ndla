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

@description("A glossary pair used in MATCHING questions")
case class GlossaryPairDTO(
    @description("Word or term")
    word: String,
    @description("Definition or translation")
    definition: String,
)
object GlossaryPairDTO {
  implicit val encoder: Encoder[GlossaryPairDTO] = deriveEncoder
  implicit val decoder: Decoder[GlossaryPairDTO] = deriveDecoder
}
