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

sealed trait VerificationStatus extends EnumEntry                                                   {}
object VerificationStatus       extends Enum[VerificationStatus] with CirceEnum[VerificationStatus] {

  case object EXTERNAL         extends VerificationStatus
  case object CREATED_BY_NDLA  extends VerificationStatus
  case object VERIFIED_BY_NDLA extends VerificationStatus

  override def values: IndexedSeq[VerificationStatus] = findValues

  def valueOf(s: String): Option[VerificationStatus] = {
    VerificationStatus.values.find(_.toString == s.toUpperCase)
  }

  def valueOfOrDefault(s: String): VerificationStatus = {
    valueOf(s).getOrElse(VerificationStatus.EXTERNAL)
  }

  implicit val schema: Schema[VerificationStatus]    = schemaForEnumEntry[VerificationStatus]
  implicit val codec: PlainCodec[VerificationStatus] = plainCodecEnumEntry[VerificationStatus]
}
