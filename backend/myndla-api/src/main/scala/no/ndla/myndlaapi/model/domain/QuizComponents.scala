/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}

/** Et svaralternativ i en SINGLE_CHOICE- eller MULTI_CHOICE-spørsmål. */
case class Alternative(id: String, text: String, isCorrect: Boolean)

object Alternative {
  implicit val encoder: Encoder[Alternative] = deriveEncoder
  implicit val decoder: Decoder[Alternative] = deriveDecoder
}

/** Et glose-/koblings-par i et MATCHING-spørsmål. */
case class GlossaryPair(word: String, definition: String)

object GlossaryPair {
  implicit val encoder: Encoder[GlossaryPair] = deriveEncoder
  implicit val decoder: Decoder[GlossaryPair] = deriveDecoder
}

/** Visningsinnstillinger for en quiz. */
case class DisplaySettings(
    randomOrder: Boolean,
    randomSubset: Boolean = false,
    questionCount: Option[Int] = None,
)

object DisplaySettings {
  val default: DisplaySettings                   = DisplaySettings(randomOrder = false)
  implicit val encoder: Encoder[DisplaySettings] = deriveEncoder
  implicit val decoder: Decoder[DisplaySettings] = Decoder.instance { c =>
    for {
      randomOrder        <- c.get[Boolean]("randomOrder")
      randomSubset       <- c.getOrElse[Boolean]("randomSubset")(false)
      questionCount      <- c.get[Option[Int]]("questionCount")
    } yield DisplaySettings(randomOrder, randomSubset, questionCount)
  }
}
