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

sealed trait QuizStatus extends EnumEntry
object QuizStatus       extends Enum[QuizStatus] with CirceEnum[QuizStatus] {
  case object DRAFT     extends QuizStatus
  case object PUBLISHED extends QuizStatus
  case object ARCHIVED  extends QuizStatus

  override def values: IndexedSeq[QuizStatus] = findValues
  implicit val schema: Schema[QuizStatus]     = schemaForEnumEntry[QuizStatus]
}
