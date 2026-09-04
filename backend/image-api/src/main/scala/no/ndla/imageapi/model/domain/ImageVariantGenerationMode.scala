/*
 * Part of NDLA image-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.model.domain

import enumeratum.{Enum, EnumEntry}

sealed trait ImageVariantGenerationMode extends EnumEntry

object ImageVariantGenerationMode extends Enum[ImageVariantGenerationMode] {
  sealed trait Generating extends ImageVariantGenerationMode

  case object MissingOnly       extends Generating
  case object ReplaceAll        extends Generating
  case object CleanupLegacyKeys extends ImageVariantGenerationMode

  val values: IndexedSeq[ImageVariantGenerationMode] = findValues
}
