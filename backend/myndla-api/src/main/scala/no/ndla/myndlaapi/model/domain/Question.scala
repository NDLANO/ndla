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
import no.ndla.common.model.NDLADate

case class Question(
    id: String,
    questionType: QuestionType,
    /** Spørsmålstekst – språk-nøklet. */
    title: String,
    /** Svaralternativer (brukes for SINGLE_CHOICE og MULTI_CHOICE). */
    alternatives: Seq[Alternative],
    /** Glose-par (brukes for MATCHING). */
    glossaryPairs: Seq[GlossaryPair],
    created: NDLADate,
    updated: NDLADate,
)

object Question {
  implicit val encoder: Encoder[Question] = deriveEncoder
  implicit val decoder: Decoder[Question] = deriveDecoder
}
