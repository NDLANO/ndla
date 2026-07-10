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
import sttp.tapir.Schema
import sttp.tapir.Schema.annotations.description

import java.util.UUID

@description("A new question to add to a quiz")
sealed trait NewQuestionDTO {
  @description("The question text")
  val prompt: String
}

case class NewSingleChoiceQuestionDTO(
    prompt: String,
    @description("The selectable choices")
    options: List[ChoiceDTO],
    @description("The id of the correct choice")
    correctOptionId: UUID,
    typename: "NewSingleChoiceQuestionDTO" = "NewSingleChoiceQuestionDTO",
) extends NewQuestionDTO

case class NewMultipleChoiceQuestionDTO(
    prompt: String,
    @description("The selectable choices")
    options: List[ChoiceDTO],
    @description("The ids of the correct choices")
    correctOptionIds: Set[UUID],
    typename: "NewMultipleChoiceQuestionDTO" = "NewMultipleChoiceQuestionDTO",
) extends NewQuestionDTO

case class NewFreeTextQuestionDTO(prompt: String, typename: "NewFreeTextQuestionDTO" = "NewFreeTextQuestionDTO")
    extends NewQuestionDTO

object NewQuestionDTO {
  implicit val encoder: Encoder[NewQuestionDTO] = Encoder.instance[NewQuestionDTO] { question =>
    val json = question match {
      case q: NewSingleChoiceQuestionDTO   => q.asJson
      case q: NewMultipleChoiceQuestionDTO => q.asJson
      case q: NewFreeTextQuestionDTO       => q.asJson
    }
    CirceUtil.addTypenameDiscriminator(json, question.getClass)
  }

  implicit val s1: Schema["NewSingleChoiceQuestionDTO"]   = stringLiteralSchema("NewSingleChoiceQuestionDTO")
  implicit val s2: Schema["NewMultipleChoiceQuestionDTO"] = stringLiteralSchema("NewMultipleChoiceQuestionDTO")
  implicit val s3: Schema["NewFreeTextQuestionDTO"]       = stringLiteralSchema("NewFreeTextQuestionDTO")

  implicit val decoder: Decoder[NewQuestionDTO] = List[Decoder[NewQuestionDTO]](
    Decoder[NewSingleChoiceQuestionDTO].widen,
    Decoder[NewMultipleChoiceQuestionDTO].widen,
    Decoder[NewFreeTextQuestionDTO].widen,
  ).reduceLeft(_ or _)

  implicit val schema: Schema[NewQuestionDTO] = DeriveHelpers.getSchema
}
