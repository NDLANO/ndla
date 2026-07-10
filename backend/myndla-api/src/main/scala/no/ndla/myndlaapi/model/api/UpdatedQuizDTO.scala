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
import no.ndla.common.DeriveHelpers
import sttp.tapir.Schema
import sttp.tapir.Schema.annotations.description

@description("Data used to update an existing quiz. Only provided fields are changed.")
case class UpdatedQuizDTO(
    @description("Name of the quiz")
    name: Option[String],
    @description("Description of the quiz")
    description: Option[String],
    @description("Share status of the quiz (PRIVATE, PUBLIC)")
    status: Option[String],
    @description("Layout of the quiz (SINGLE_PAGE, MULTI_PAGE)")
    layout: Option[String],
    @description("The questions of the quiz. When provided, replaces all existing questions.")
    questions: Option[List[NewQuestionDTO]],
)

object UpdatedQuizDTO {
  implicit val encoder: Encoder[UpdatedQuizDTO] = deriveEncoder
  implicit val decoder: Decoder[UpdatedQuizDTO] = deriveDecoder
  import sttp.tapir.generic.auto.*
  implicit val schema: Schema[UpdatedQuizDTO] = DeriveHelpers.getSchema
}
