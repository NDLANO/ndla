/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.dtos

import io.swagger.v3.oas.annotations.media.Schema
import no.ndla.taxonomy.domain.Translation

@Schema(name = "Translation", requiredProperties = ["language", "name"])
class TranslationDTO(
    @field:Schema(description = "ISO 639-1 language code", example = "en") val language: String,
    @field:Schema(description = "The translated name of the node", example = "Trigonometry")
    val name: String,
) : Comparable<TranslationDTO> {
  constructor(translation: Translation) : this(translation.languageCode!!, translation.name!!)

  override fun compareTo(other: TranslationDTO): Int = language.compareTo(other.language)
}
