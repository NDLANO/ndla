/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.api

import enumeratum.*
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.DeriveHelpers
import sttp.tapir.Schema
import sttp.tapir.codec.enumeratum.*
import sttp.tapir.Schema.annotations.description

import java.util.UUID

sealed trait AnswerResult extends EnumEntry

object AnswerResult extends Enum[AnswerResult] with CirceEnum[AnswerResult] {
  case object CORRECT   extends AnswerResult
  case object INCORRECT extends AnswerResult
  case object UNSCORED  extends AnswerResult

  val values: IndexedSeq[AnswerResult] = findValues

  implicit val schema: Schema[AnswerResult] = schemaForEnumEntry[AnswerResult]
}

@description("The verification result for a single question")
case class QuestionResultDTO(
    @description("The id of the question")
    questionId: UUID,
    @description("Whether the submitted answer was CORRECT, INCORRECT or UNSCORED (free text is not auto-scored)")
    result: AnswerResult,
)

object QuestionResultDTO {
  implicit val encoder: Encoder[QuestionResultDTO] = deriveEncoder
  implicit val decoder: Decoder[QuestionResultDTO] = deriveDecoder
}

@description("The result of verifying submitted answers against a quiz")
case class QuizVerificationDTO(
    @description("The result for each question")
    results: List[QuestionResultDTO]
)

object QuizVerificationDTO {
  implicit val encoder: Encoder[QuizVerificationDTO] = deriveEncoder
  implicit val decoder: Decoder[QuizVerificationDTO] = deriveDecoder
  import sttp.tapir.generic.auto.*
  implicit val schema: Schema[QuizVerificationDTO] = DeriveHelpers.getSchema
}
