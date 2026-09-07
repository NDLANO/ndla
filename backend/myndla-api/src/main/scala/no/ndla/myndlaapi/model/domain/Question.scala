/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import io.circe.generic.semiauto.deriveEncoder
import io.circe.{Decoder, Encoder}
import no.ndla.common.model.NDLADate

case class Question(
    id: String,
    questionType: QuestionType,
    language: String,
    title: String,
    /** Svaralternativer (brukes for SINGLE_CHOICE og MULTI_CHOICE). */
    alternatives: Seq[Alternative],
    /** Glose-par (brukes for MATCHING). */
    glossaryPairs: Seq[GlossaryPair],
    required: Boolean = false,
    alternativesRandomOrder: Boolean = false,
    created: NDLADate,
    updated: NDLADate,
)

object Question {
  implicit val encoder: Encoder[Question] = deriveEncoder
  // NOTE: Scala 3 circe derivation does not honor default values for missing fields, so
  // `required` and `alternativesRandomOrder` are decoded manually to stay backwards
  // compatible with rows persisted before these fields existed.
  implicit val decoder: Decoder[Question] = Decoder.instance { c =>
    for {
      id                      <- c.get[String]("id")
      questionType            <- c.get[QuestionType]("questionType")
      language                <- c.get[String]("language")
      title                   <- c.get[String]("title")
      alternatives            <- c.get[Seq[Alternative]]("alternatives")
      glossaryPairs           <- c.get[Seq[GlossaryPair]]("glossaryPairs")
      required                <- c.getOrElse[Boolean]("required")(false)
      alternativesRandomOrder <- c.getOrElse[Boolean]("alternativesRandomOrder")(false)
      created                 <- c.get[NDLADate]("created")
      updated                 <- c.get[NDLADate]("updated")
    } yield Question(
      id,
      questionType,
      language,
      title,
      alternatives,
      glossaryPairs,
      required,
      alternativesRandomOrder,
      created,
      updated,
    )
  }
}
