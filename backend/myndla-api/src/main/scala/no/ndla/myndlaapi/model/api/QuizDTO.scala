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
import no.ndla.common.model.NDLADate
import sttp.tapir.Schema
import sttp.tapir.Schema.annotations.description

import java.util.UUID

@description("Information about a quiz")
case class QuizDTO(
    @description("Unique id of the quiz")
    id: UUID,
    @description("Name of the quiz")
    name: String,
    @description("Description of the quiz")
    description: Option[String],
    @description("Share status of the quiz (PRIVATE, PUBLIC)")
    status: String,
    @description("Layout of the quiz (SINGLE_PAGE, MULTI_PAGE)")
    layout: String,
    @description("The questions of the quiz")
    questions: List[QuestionDTO],
    @description("When the quiz was created")
    created: NDLADate,
    @description("When the quiz was last updated")
    updated: NDLADate,
    @description("When the quiz was last shared")
    shared: Option[NDLADate],
)

object QuizDTO {
  implicit val encoder: Encoder[QuizDTO] = deriveEncoder
  implicit val decoder: Decoder[QuizDTO] = deriveDecoder
  import sttp.tapir.generic.auto.*
  implicit val schema: Schema[QuizDTO] = DeriveHelpers.getSchema
}
