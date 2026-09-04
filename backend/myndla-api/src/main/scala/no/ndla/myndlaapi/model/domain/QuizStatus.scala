/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import enumeratum.*
import no.ndla.common.errors.ValidationException
import sttp.tapir.Schema
import sttp.tapir.codec.enumeratum.*

import scala.util.{Failure, Success, Try}

sealed trait QuizStatus extends EnumEntry

object QuizStatus extends Enum[QuizStatus] with CirceEnum[QuizStatus] {
  case object IN_PROGRESS extends QuizStatus
  case object PRIVATE     extends QuizStatus
  case object PUBLIC      extends QuizStatus

  val values: IndexedSeq[QuizStatus] = findValues

  def valueOf(s: String): Option[QuizStatus] = values.find(_.entryName == s.toUpperCase)

  def valueOfOrError(s: String): Try[QuizStatus] = valueOf(s) match {
    case Some(status) => Success(status)
    case None         =>
      val valid = values.map(_.entryName).mkString(", ")
      Failure(ValidationException("status", s"'$s' is not a valid quiz status. Must be one of $valid"))
  }

  implicit val schema: Schema[QuizStatus] = schemaForEnumEntry[QuizStatus]
}
