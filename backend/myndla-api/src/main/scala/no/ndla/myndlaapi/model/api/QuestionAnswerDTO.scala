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
