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

import java.util.UUID

@description("A submitted answer to a single question")
case class SubmittedAnswerDTO(
    @description("The id of the question being answered")
    questionId: UUID,
    @description("The ids of the selected choices (for single/multiple choice questions)")
    selectedOptionIds: List[UUID],
    @description("The submitted free text (for free text questions)")
    freeText: Option[String],
)

object SubmittedAnswerDTO {
  implicit val encoder: Encoder[SubmittedAnswerDTO] = deriveEncoder
  implicit val decoder: Decoder[SubmittedAnswerDTO] = deriveDecoder
}

@description("Answers submitted for verification against a quiz")
case class SubmittedAnswersDTO(
    @description("The submitted answers")
    answers: List[SubmittedAnswerDTO]
)

object SubmittedAnswersDTO {
  implicit val encoder: Encoder[SubmittedAnswersDTO] = deriveEncoder
  implicit val decoder: Decoder[SubmittedAnswersDTO] = deriveDecoder
  import sttp.tapir.generic.auto.*
  implicit val schema: Schema[SubmittedAnswersDTO] = DeriveHelpers.getSchema
}
