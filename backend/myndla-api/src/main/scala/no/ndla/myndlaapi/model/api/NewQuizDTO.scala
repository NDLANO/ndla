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
import no.ndla.myndlaapi.model.domain.DisplaySettings
import sttp.tapir.Schema.annotations.description

@description("Input for creating a new quiz")
case class NewQuizDTO(
    @description("Quiz title")
    title: String,
    @description("Quiz description")
    description: Option[String],
    @description("Display settings")
    displaySettings: Option[DisplaySettings],
)
object NewQuizDTO {
  implicit val encoder: Encoder[NewQuizDTO] = deriveEncoder
  implicit val decoder: Decoder[NewQuizDTO] = deriveDecoder
}
