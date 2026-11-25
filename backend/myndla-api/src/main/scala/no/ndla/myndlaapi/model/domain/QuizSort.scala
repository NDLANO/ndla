/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import enumeratum.*
import sttp.tapir.Codec.PlainCodec
import sttp.tapir.Schema
import sttp.tapir.codec.enumeratum.*

sealed abstract class QuizSort(override val entryName: String) extends EnumEntry

object QuizSort extends Enum[QuizSort] with CirceEnum[QuizSort] {
  case object ByCreatedDesc extends QuizSort("-created")
  case object ByCreatedAsc  extends QuizSort("created")

  val values: IndexedSeq[QuizSort] = findValues

  val all: Seq[String] = values.map(_.entryName)

  implicit val schema: Schema[QuizSort]    = schemaForEnumEntry[QuizSort]
  implicit val codec: PlainCodec[QuizSort] = plainCodecEnumEntry[QuizSort]
}
