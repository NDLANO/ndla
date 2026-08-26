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
import no.ndla.myndlaapi.model.domain.{DisplaySettings, QuizStatus}
import sttp.tapir.Schema.annotations.description

import java.util.UUID

@description("A quiz")
case class QuizDTO(
    @description("Unique identifier")
    id: UUID,
    @description("Revision number")
    revision: Int,
    @description("Quiz title")
    title: String,
    @description("Quiz description")
    description: Option[String],
    @description("Questions in this quiz")
    questions: Seq[QuestionDTO],
    @description("Status (PRIVATE, PUBLIC)")
    status: QuizStatus,
    @description("Creation date")
    created: NDLADate,
    @description("Last updated date")
    updated: NDLADate,
    @description("Date this quiz was made public")
    published: Option[NDLADate],
    @description("Display settings")
    displaySettings: DisplaySettings,
    @description("Languages this quiz supports")
    supportedLanguages: Seq[String],
)
object QuizDTO {
  implicit val encoder: Encoder[QuizDTO] = deriveEncoder
  implicit val decoder: Decoder[QuizDTO] = deriveDecoder
}
