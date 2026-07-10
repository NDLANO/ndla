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

sealed trait QuizLayout extends EnumEntry

object QuizLayout extends Enum[QuizLayout] with CirceEnum[QuizLayout] {
  case object SINGLE_PAGE extends QuizLayout
  case object MULTI_PAGE  extends QuizLayout

  val values: IndexedSeq[QuizLayout] = findValues

  def valueOf(s: String): Option[QuizLayout] = values.find(_.entryName == s.toUpperCase)

  def valueOfOrError(s: String): Try[QuizLayout] = valueOf(s) match {
    case Some(layout) => Success(layout)
    case None         =>
      val valid = values.map(_.entryName).mkString(", ")
      Failure(ValidationException("layout", s"'$s' is not a valid quiz layout. Must be one of $valid"))
  }

  implicit val schema: Schema[QuizLayout] = schemaForEnumEntry[QuizLayout]
}
