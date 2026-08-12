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

/** Et svaralternativ i en SINGLE_CHOICE- eller MULTI_CHOICE-spørsmål. */
case class Alternative(
    id: String,
    text: String,
    isCorrect: Boolean,
)

object Alternative {
  implicit val encoder: Encoder[Alternative] = deriveEncoder
  implicit val decoder: Decoder[Alternative] = deriveDecoder
}

/** Et glose-/koblings-par i et MATCHING-spørsmål. */
case class GlossaryPair(
    word: String,
    definition: String,
)

object GlossaryPair {
  implicit val encoder: Encoder[GlossaryPair] = deriveEncoder
  implicit val decoder: Decoder[GlossaryPair] = deriveDecoder
}

/** Visningsinnstillinger for en quiz. */
case class DisplaySettings(
    randomOrder: Boolean,
    oneQuestionAtATime: Boolean,
)

object DisplaySettings {
  val default: DisplaySettings                   = DisplaySettings(randomOrder = false, oneQuestionAtATime = false)
  implicit val encoder: Encoder[DisplaySettings] = deriveEncoder
  implicit val decoder: Decoder[DisplaySettings] = deriveDecoder
}
