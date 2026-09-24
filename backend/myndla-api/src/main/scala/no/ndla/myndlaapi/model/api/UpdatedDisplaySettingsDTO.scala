/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.api

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import sttp.tapir.Schema.annotations.description

@description("Input for updating display settings for a quiz")
case class UpdatedDisplaySettingsDTO(
    @description("Whether questions are shown in random order")
    randomOrder: Option[Boolean],
    @description("Whether a random subset of questions is shown")
    randomSubset: Option[Boolean],
    @description("Number of questions to show if randomSubset is enabled")
    questionCount: Option[Int],
)
object UpdatedDisplaySettingsDTO {
  implicit val encoder: Encoder[UpdatedDisplaySettingsDTO] = deriveEncoder
  implicit val decoder: Decoder[UpdatedDisplaySettingsDTO] = deriveDecoder
}
