/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.{Decoder, DecodingFailure, Encoder}
import no.ndla.common.CirceUtil
import no.ndla.common.model.NDLADate

import java.util.UUID

case class Choice(id: UUID, text: String)

object Choice {
  implicit val encoder: Encoder[Choice] = deriveEncoder
  implicit val decoder: Decoder[Choice] = deriveDecoder
}

sealed trait Question {
  def id: UUID
  def created: NDLADate
  def updated: NDLADate
  def prompt: String
}

case class SingleChoiceQuestion(
    id: UUID,
    created: NDLADate,
    updated: NDLADate,
    prompt: String,
    options: List[Choice],
    correctOptionId: UUID,
) extends Question

case class MultipleChoiceQuestion(
    id: UUID,
    created: NDLADate,
    updated: NDLADate,
    prompt: String,
    options: List[Choice],
    correctOptionIds: Set[UUID],
) extends Question

case class FreeTextQuestion(id: UUID, created: NDLADate, updated: NDLADate, prompt: String) extends Question

object Question {
  private implicit val singleEncoder: Encoder[SingleChoiceQuestion]     = deriveEncoder
  private implicit val singleDecoder: Decoder[SingleChoiceQuestion]     = deriveDecoder
  private implicit val multipleEncoder: Encoder[MultipleChoiceQuestion] = deriveEncoder
  private implicit val multipleDecoder: Decoder[MultipleChoiceQuestion] = deriveDecoder
  private implicit val freeTextEncoder: Encoder[FreeTextQuestion]       = deriveEncoder
  private implicit val freeTextDecoder: Decoder[FreeTextQuestion]       = deriveDecoder

  implicit val encoder: Encoder[Question] = Encoder.instance { question =>
    val json = question match {
      case q: SingleChoiceQuestion   => q.asJson
      case q: MultipleChoiceQuestion => q.asJson
      case q: FreeTextQuestion       => q.asJson
    }
    CirceUtil.addTypenameDiscriminator(json, question.getClass)
  }

  implicit val decoder: Decoder[Question] = Decoder.instance { cursor =>
    cursor
      .downField("typename")
      .as[String]
      .flatMap {
        case "SingleChoiceQuestion"   => cursor.as[SingleChoiceQuestion]
        case "MultipleChoiceQuestion" => cursor.as[MultipleChoiceQuestion]
        case "FreeTextQuestion"       => cursor.as[FreeTextQuestion]
        case other                    => Left(DecodingFailure(s"'$other' is not a known question type", cursor.history))
      }
  }
}
