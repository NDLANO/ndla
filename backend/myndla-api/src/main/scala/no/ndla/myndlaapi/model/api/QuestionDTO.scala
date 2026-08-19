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
import no.ndla.common.model.NDLADate
import no.ndla.myndlaapi.model.domain.QuestionType
import sttp.tapir.Schema.annotations.description

@description("A question in a quiz")
case class QuestionDTO(
    @description("Unique identifier")
    id: String,
    @description("Question type")
    questionType: QuestionType,
    @description("The language of the question text")
    language: String,
    @description("Question text")
    title: String,
    @description("Answer alternatives (SINGLE_CHOICE / MULTI_CHOICE)")
    alternatives: Seq[AlternativeDTO],
    @description("Glossary pairs (MATCHING)")
    glossaryPairs: Seq[GlossaryPairDTO],
    @description("Creation date")
    created: NDLADate,
    @description("Last updated date")
    updated: NDLADate,
)
object QuestionDTO {
  implicit val encoder: Encoder[QuestionDTO] = deriveEncoder
  implicit val decoder: Decoder[QuestionDTO] = deriveDecoder
}

@description("Input for creating a new question")
case class NewQuestionDTO(
    @description("Question type")
    questionType: QuestionType,
    @description("Question text")
    title: String,
    @description("Answer alternatives")
    alternatives: Seq[NewAlternativeDTO],
    @description("Glossary pairs for MATCHING questions")
    glossaryPairs: Seq[GlossaryPairDTO],
)
object NewQuestionDTO {
  implicit val encoder: Encoder[NewQuestionDTO] = deriveEncoder
  implicit val decoder: Decoder[NewQuestionDTO] = deriveDecoder
}

@description("Input for updating an existing question")
case class UpdatedQuestionDTO(
    @description("Question type")
    questionType: Option[QuestionType],
    @description("Question text")
    title: Option[String],
    @description("Answer alternatives (replaces all if provided)")
    alternatives: Option[Seq[NewAlternativeDTO]],
    @description("Glossary pairs (replaces all if provided)")
    glossaryPairs: Option[Seq[GlossaryPairDTO]],
)
object UpdatedQuestionDTO {
  implicit val encoder: Encoder[UpdatedQuestionDTO] = deriveEncoder
  implicit val decoder: Decoder[UpdatedQuestionDTO] = deriveDecoder
}
