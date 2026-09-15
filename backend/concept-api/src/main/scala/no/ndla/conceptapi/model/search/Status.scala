/*
 * Part of NDLA concept-api
 * Copyright (C) 2020 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.conceptapi.model.search

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.model.domain.concept.ConceptStatus

case class Status(current: ConceptStatus, other: Seq[ConceptStatus])

object Status {
  implicit val encoder: Encoder[Status] = deriveEncoder
  implicit val decoder: Decoder[Status] = deriveDecoder
}
