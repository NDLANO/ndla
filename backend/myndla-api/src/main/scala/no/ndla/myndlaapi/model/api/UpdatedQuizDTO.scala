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

import java.util.UUID

@description("Input for updating a quiz")
case class UpdatedQuizDTO(
    @description("Revision number for optimistic locking")
    revision: Int,
    @description("Quiz title")
    title: Option[String],
    @description("Quiz description")
    description: Option[String],
    @description("Display settings")
    displaySettings: Option[UpdatedDisplaySettingsDTO],
    @description("Ids of the questions in the desired order. Questions not listed are placed last in their existing order")
    questionOrder: Option[Seq[UUID]],
)
object UpdatedQuizDTO {
  implicit val encoder: Encoder[UpdatedQuizDTO] = deriveEncoder
  implicit val decoder: Decoder[UpdatedQuizDTO] = deriveDecoder
}
