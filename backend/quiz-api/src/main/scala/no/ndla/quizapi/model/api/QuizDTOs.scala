/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.model.api

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.model.NDLADate
import no.ndla.quizapi.model.domain.{DisplaySettings, QuestionType, QuizStatus}
import sttp.tapir.Schema.annotations.description

@description("A single answer alternative for SINGLE_CHOICE or MULTI_CHOICE questions")
case class AlternativeDTO(
    @description("Unique identifier for the alternative")
    id: String,
    @description("Answer text")
    text: String,
    @description("Whether this alternative is correct (visible to staff only)")
    isCorrect: Option[Boolean],
)
object AlternativeDTO {
  implicit val encoder: Encoder[AlternativeDTO] = deriveEncoder
  implicit val decoder: Decoder[AlternativeDTO] = deriveDecoder
}

@description("A glossary pair used in MATCHING questions")
case class GlossaryPairDTO(
    @description("Word or term")
    word: String,
    @description("Definition or translation")
    definition: String,
)
object GlossaryPairDTO {
  implicit val encoder: Encoder[GlossaryPairDTO] = deriveEncoder
  implicit val decoder: Decoder[GlossaryPairDTO] = deriveDecoder
}

@description("A question in a quiz")
case class QuestionDTO(
    @description("Unique identifier")
    id: String,
    @description("Question type")
    questionType: QuestionType,
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
case class UpdateQuestionDTO(
    @description("Question type")
    questionType: Option[QuestionType],
    @description("Question text")
    title: Option[String],
    @description("Answer alternatives (replaces all if provided)")
    alternatives: Option[Seq[NewAlternativeDTO]],
    @description("Glossary pairs (replaces all if provided)")
    glossaryPairs: Option[Seq[GlossaryPairDTO]],
)
object UpdateQuestionDTO {
  implicit val encoder: Encoder[UpdateQuestionDTO] = deriveEncoder
  implicit val decoder: Decoder[UpdateQuestionDTO] = deriveDecoder
}

@description("Input for creating an alternative")
case class NewAlternativeDTO(
    @description("Answer text")
    text: String,
    @description("Whether this alternative is correct")
    isCorrect: Boolean,
)
object NewAlternativeDTO {
  implicit val encoder: Encoder[NewAlternativeDTO] = deriveEncoder
  implicit val decoder: Decoder[NewAlternativeDTO] = deriveDecoder
}

@description("A quiz")
case class QuizDTO(
    @description("Unique identifier")
    id: Long,
    @description("Revision number")
    revision: Int,
    @description("Quiz title")
    title: String,
    @description("Quiz description")
    description: Option[String],
    @description("Questions in this quiz")
    questions: Seq[QuestionDTO],
    @description("Status")
    status: QuizStatus,
    @description("Creation date")
    created: NDLADate,
    @description("Last updated date")
    updated: NDLADate,
    @description("Published date")
    published: Option[NDLADate],
    @description("Display settings")
    displaySettings: DisplaySettings,
)
object QuizDTO {
  implicit val encoder: Encoder[QuizDTO] = deriveEncoder
  implicit val decoder: Decoder[QuizDTO] = deriveDecoder
}

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

@description("Input for updating a quiz")
case class UpdateQuizDTO(
    @description("Revision number for optimistic locking")
    revision: Int,
    @description("Quiz title")
    title: Option[String],
    @description("Quiz description")
    description: Option[String],
    @description("Display settings")
    displaySettings: Option[DisplaySettings],
)
object UpdateQuizDTO {
  implicit val encoder: Encoder[UpdateQuizDTO] = deriveEncoder
  implicit val decoder: Decoder[UpdateQuizDTO] = deriveDecoder
}

@description("Input for changing quiz status")
case class UpdateStatusDTO(
    @description("New status")
    status: QuizStatus
)
object UpdateStatusDTO {
  implicit val encoder: Encoder[UpdateStatusDTO] = deriveEncoder
  implicit val decoder: Decoder[UpdateStatusDTO] = deriveDecoder
}

@description("Selected answer for a single question")
case class QuestionAnswerDTO(
    @description("Question ID")
    questionId: String,
    @description("Selected alternative IDs (SINGLE_CHOICE / MULTI_CHOICE)")
    selectedAlternativeIds: Seq[String],
    @description("Matched pairs (MATCHING): word -> definition")
    matchedPairs: Seq[GlossaryPairDTO],
)
object QuestionAnswerDTO {
  implicit val encoder: Encoder[QuestionAnswerDTO] = deriveEncoder
  implicit val decoder: Decoder[QuestionAnswerDTO] = deriveDecoder
}

@description("Result of checking a single question")
case class QuestionResultDTO(
    @description("Question ID")
    questionId: String,
    @description("Whether the answer is fully correct")
    isCorrect: Boolean,
    @description("Score for this question")
    score: Int,
    @description("Maximum possible score")
    maxScore: Int,
    @description("IDs of the correct alternatives (revealed after check)")
    correctAlternativeIds: Seq[String],
    @description("Correct pairs (revealed after check for MATCHING)")
    correctPairs: Seq[GlossaryPairDTO],
)
object QuestionResultDTO {
  implicit val encoder: Encoder[QuestionResultDTO] = deriveEncoder
  implicit val decoder: Decoder[QuestionResultDTO] = deriveDecoder
}

@description("Input for checking all answers in a quiz")
case class CheckQuizDTO(
    @description("Answers for each question")
    answers: Seq[QuestionAnswerDTO]
)
object CheckQuizDTO {
  implicit val encoder: Encoder[CheckQuizDTO] = deriveEncoder
  implicit val decoder: Decoder[CheckQuizDTO] = deriveDecoder
}

@description("Result of checking a full quiz")
case class QuizResultDTO(
    @description("Total score achieved")
    totalScore: Int,
    @description("Maximum possible score")
    maxScore: Int,
    @description("Per-question results")
    results: Seq[QuestionResultDTO],
)
object QuizResultDTO {
  implicit val encoder: Encoder[QuizResultDTO] = deriveEncoder
  implicit val decoder: Decoder[QuizResultDTO] = deriveDecoder
}
