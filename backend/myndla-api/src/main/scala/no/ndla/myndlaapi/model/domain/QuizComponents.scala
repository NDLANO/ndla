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

import java.util.UUID

case class Alternative(id: UUID, text: String, isCorrect: Boolean)

object Alternative {
  implicit val encoder: Encoder[Alternative] = deriveEncoder
  implicit val decoder: Decoder[Alternative] = deriveDecoder
}

case class GlossaryPair(word: String, definition: String)

object GlossaryPair {
  implicit val encoder: Encoder[GlossaryPair] = deriveEncoder
  implicit val decoder: Decoder[GlossaryPair] = deriveDecoder
}

case class DisplaySettings(
    randomOrder: Boolean,
    randomSubset: Boolean = false,
    questionCount: Option[Int] = None,
    alternativesRandomOrder: Boolean = false,
)

object DisplaySettings {
  val default: DisplaySettings                   = DisplaySettings(randomOrder = false)
  implicit val encoder: Encoder[DisplaySettings] = deriveEncoder
  implicit val decoder: Decoder[DisplaySettings] = Decoder.instance { c =>
    for {
      randomOrder             <- c.get[Boolean]("randomOrder")
      randomSubset            <- c.getOrElse[Boolean]("randomSubset")(false)
      questionCount           <- c.get[Option[Int]]("questionCount")
      alternativesRandomOrder <- c.getOrElse[Boolean]("alternativesRandomOrder")(false)
    } yield DisplaySettings(randomOrder, randomSubset, questionCount, alternativesRandomOrder)
  }
}
