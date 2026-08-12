/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.model.domain

import enumeratum.*
import sttp.tapir.Schema
import sttp.tapir.codec.enumeratum.schemaForEnumEntry

sealed trait QuestionType extends EnumEntry
object QuestionType extends Enum[QuestionType] with CirceEnum[QuestionType] {
  /** Enkelt svar – ett alternativ er korrekt. */
  case object SINGLE_CHOICE extends QuestionType

  /** Multisvar – ett eller flere alternativer er korrekte. */
  case object MULTI_CHOICE extends QuestionType

  /** Kobling / Glose – match ord mot definisjon. */
  case object MATCHING extends QuestionType

  override def values: IndexedSeq[QuestionType] = findValues
  implicit val schema: Schema[QuestionType]     = schemaForEnumEntry[QuestionType]
}
