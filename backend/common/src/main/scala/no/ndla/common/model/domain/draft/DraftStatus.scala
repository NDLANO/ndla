/*
 * Part of NDLA common
 * Copyright (C) 2018 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.model.domain.draft

import enumeratum.*
import io.circe.{KeyDecoder, KeyEncoder}
import sttp.tapir.Codec.PlainCodec
import sttp.tapir.Schema
import sttp.tapir.codec.enumeratum.*

sealed trait DraftStatus extends EnumEntry {}

object DraftStatus extends Enum[DraftStatus] with CirceEnum[DraftStatus] {
  case object IMPORTED          extends DraftStatus
  case object PLANNED           extends DraftStatus
  case object IN_PROGRESS       extends DraftStatus
  case object EXTERNAL_REVIEW   extends DraftStatus
  case object INTERNAL_REVIEW   extends DraftStatus
  case object QUALITY_ASSURANCE extends DraftStatus
  case object LANGUAGE          extends DraftStatus
  case object FOR_APPROVAL      extends DraftStatus
  case object END_CONTROL       extends DraftStatus
  case object PUBLISH_DELAYED   extends DraftStatus
  case object PUBLISHED         extends DraftStatus
  case object REPUBLISH         extends DraftStatus
  case object UNPUBLISHED       extends DraftStatus
  case object ARCHIVED          extends DraftStatus

  val values: IndexedSeq[DraftStatus] = findValues

  def valueOf(s: String): Option[DraftStatus] = values.find(_.toString == s.toUpperCase)

  val thatDoesNotRequireResponsible: Seq[DraftStatus] = Seq(PUBLISHED, UNPUBLISHED, ARCHIVED)
  val thatRequiresResponsible: Seq[DraftStatus]       = this.values.filterNot(thatDoesNotRequireResponsible.contains)

  implicit def ordering[A <: DraftStatus]: Ordering[DraftStatus] =
    (x: DraftStatus, y: DraftStatus) => indexOf(x) - indexOf(y)

  implicit val schema: Schema[DraftStatus]    = schemaForEnumEntry[DraftStatus]
  implicit val codec: PlainCodec[DraftStatus] = plainCodecEnumEntry[DraftStatus]

  implicit val keyEncoder: KeyEncoder[DraftStatus] = KeyEncoder.encodeKeyString.contramap(_.entryName)
  implicit val keyDecoder: KeyDecoder[DraftStatus] = KeyDecoder.instance(valueOf)

}
