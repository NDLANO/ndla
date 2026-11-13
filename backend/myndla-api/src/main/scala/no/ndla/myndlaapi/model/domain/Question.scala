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

import java.util.UUID

case class Question(
    id: UUID,
    questionType: QuestionType,
    language: String,
    title: String,
    alternatives: Seq[Alternative],
    glossaryPairs: Seq[GlossaryPair],
    required: Boolean = false,
    alternativesRandomOrder: Boolean = false,
    sortOrder: Int = 0,
    created: NDLADate,
    updated: NDLADate,
)

object Question {
  implicit val encoder: Encoder[Question] = deriveEncoder
  implicit val decoder: Decoder[Question] = Decoder.instance { c =>
    for {
      id                      <- c.get[UUID]("id")
      questionType            <- c.get[QuestionType]("questionType")
      language                <- c.get[String]("language")
      title                   <- c.get[String]("title")
      alternatives            <- c.get[Seq[Alternative]]("alternatives")
      glossaryPairs           <- c.get[Seq[GlossaryPair]]("glossaryPairs")
      required                <- c.getOrElse[Boolean]("required")(false)
      alternativesRandomOrder <- c.getOrElse[Boolean]("alternativesRandomOrder")(false)
      sortOrder               <- c.getOrElse[Int]("sortOrder")(0)
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
      sortOrder,
      created,
      updated,
    )
  }
}
