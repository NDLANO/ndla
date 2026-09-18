/*
 * Part of NDLA common
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.model.domain.learningpath

import enumeratum.*
import sttp.tapir.Codec.PlainCodec
import sttp.tapir.Schema
import sttp.tapir.codec.enumeratum.*

sealed abstract class StepStatus(override val entryName: String) extends EnumEntry
object StepStatus                                                extends Enum[StepStatus] with CirceEnum[StepStatus] {

  case object ACTIVE  extends StepStatus("ACTIVE")
  case object DELETED extends StepStatus("DELETED")

  implicit val schema: Schema[StepStatus]    = schemaForEnumEntry[StepStatus]
  implicit val codec: PlainCodec[StepStatus] = plainCodecEnumEntry[StepStatus]

  def values: IndexedSeq[StepStatus] = findValues

  def valueOf(s: String): Option[StepStatus] = {
    StepStatus.values.find(_.entryName == s)
  }

}
