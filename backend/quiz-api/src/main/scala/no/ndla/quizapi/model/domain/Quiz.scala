/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.model.domain

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.{Description, Title}

case class Quiz(
    id: Option[Long],
    revision: Option[Int],
    title: Seq[Title],
    description: Seq[Description],
    questions: Seq[Question],
    status: QuizStatus,
    created: NDLADate,
    updated: NDLADate,
    updatedBy: String,
    published: Option[NDLADate],
    displaySettings: DisplaySettings,
)

object Quiz {
  implicit val encoder: Encoder[Quiz] = deriveEncoder
  implicit val decoder: Decoder[Quiz] = deriveDecoder
}
