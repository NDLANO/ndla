/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.api

import cats.implicits.*
import io.circe.generic.auto.*
import io.circe.syntax.*
import io.circe.{Decoder, Encoder}
import no.ndla.common.CirceUtil
import no.ndla.common.DeriveHelpers
import no.ndla.common.TapirUtil.stringLiteralSchema
import no.ndla.common.model.NDLADate
import sttp.tapir.Schema
import sttp.tapir.Schema.annotations.description

import java.util.UUID

@description("A selectable choice in a choice-based question")
case class ChoiceDTO(
    @description("Unique id of the choice")
    id: UUID,
    @description("The choice text")
    text: String,
)

object ChoiceDTO {
  implicit val encoder: Encoder[ChoiceDTO] = io.circe.generic.semiauto.deriveEncoder
  implicit val decoder: Decoder[ChoiceDTO] = io.circe.generic.semiauto.deriveDecoder
  implicit val schema: Schema[ChoiceDTO]   = {
    import sttp.tapir.generic.auto.*
    Schema.derived
  }
}

@description("A single question in a quiz")
sealed trait QuestionDTO {
  @description("Unique id of the question")
  val id: UUID
  @description("When the question was created")
  val created: NDLADate
  @description("When the question was last updated")
  val updated: NDLADate
  @description("The question text")
  val prompt: String
}

case class SingleChoiceQuestionDTO(
    id: UUID,
    created: NDLADate,
    updated: NDLADate,
    prompt: String,
    @description("The selectable choices")
    options: List[ChoiceDTO],
    @description("The id of the correct choice. Only present when the caller is allowed to see answers.")
    correctOptionId: Option[UUID],
    typename: "SingleChoiceQuestionDTO" = "SingleChoiceQuestionDTO",
) extends QuestionDTO

case class MultipleChoiceQuestionDTO(
    id: UUID,
    created: NDLADate,
    updated: NDLADate,
    prompt: String,
    @description("The selectable choices")
    options: List[ChoiceDTO],
    @description("The ids of the correct choices. Only present when the caller is allowed to see answers.")
    correctOptionIds: Option[Set[UUID]],
    typename: "MultipleChoiceQuestionDTO" = "MultipleChoiceQuestionDTO",
) extends QuestionDTO

case class FreeTextQuestionDTO(
    id: UUID,
    created: NDLADate,
    updated: NDLADate,
    prompt: String,
    typename: "FreeTextQuestionDTO" = "FreeTextQuestionDTO",
) extends QuestionDTO

object QuestionDTO {
  implicit val encoder: Encoder[QuestionDTO] = Encoder.instance[QuestionDTO] { question =>
    val json = question match {
      case q: SingleChoiceQuestionDTO   => q.asJson
      case q: MultipleChoiceQuestionDTO => q.asJson
      case q: FreeTextQuestionDTO       => q.asJson
    }
    CirceUtil.addTypenameDiscriminator(json, question.getClass)
  }

  implicit val s1: Schema["SingleChoiceQuestionDTO"]   = stringLiteralSchema("SingleChoiceQuestionDTO")
  implicit val s2: Schema["MultipleChoiceQuestionDTO"] = stringLiteralSchema("MultipleChoiceQuestionDTO")
  implicit val s3: Schema["FreeTextQuestionDTO"]       = stringLiteralSchema("FreeTextQuestionDTO")

  implicit val decoder: Decoder[QuestionDTO] = List[Decoder[QuestionDTO]](
    Decoder[SingleChoiceQuestionDTO].widen,
    Decoder[MultipleChoiceQuestionDTO].widen,
    Decoder[FreeTextQuestionDTO].widen,
  ).reduceLeft(_ or _)

  implicit val schema: Schema[QuestionDTO] = DeriveHelpers.getSchema
}
