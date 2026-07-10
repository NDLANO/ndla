/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.api

import io.circe.{Decoder, Encoder}
import no.ndla.common.DeriveHelpers
import sttp.tapir.Schema
import sttp.tapir.Schema.annotations.description

@description("Data used to create a new quiz")
case class NewQuizDTO(
    @description("Name of the quiz")
    name: String,
    @description("Description of the quiz")
    description: Option[String],
    @description("Share status of the quiz (PRIVATE, PUBLIC). Defaults to PRIVATE.")
    status: Option[String],
    @description("Layout of the quiz (SINGLE_PAGE, MULTI_PAGE)")
    layout: String,
    @description("The questions of the quiz")
    questions: List[NewQuestionDTO],
)

object NewQuizDTO {
  implicit val encoder: Encoder[NewQuizDTO] = io.circe.generic.semiauto.deriveEncoder
  implicit val decoder: Decoder[NewQuizDTO] = io.circe.generic.semiauto.deriveDecoder
  import sttp.tapir.generic.auto.*
  implicit val schema: Schema[NewQuizDTO] = DeriveHelpers.getSchema
}
