/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1.dtos.searchapi

import io.swagger.v3.oas.annotations.media.Schema
import no.ndla.taxonomy.domain.LanguageField
import org.springframework.data.util.Pair

@Schema(name = "LanguageField", type = "object")
class LanguageFieldDTO<V : Any>() : HashMap<String, V>() {

  constructor(translations: List<Pair<String, V>>) : this() {
    translations.forEach { t -> this[t.first] = t.second }
  }

  // Hide inherited method from documentation
  @Schema(hidden = true) override fun isEmpty(): Boolean = super.isEmpty()

  companion object {
    @JvmStatic
    fun fromLanguageField(languageField: LanguageField<String>): LanguageFieldDTO<String> {
      val dto = LanguageFieldDTO<String>()
      languageField.forEach { (key, value) -> dto[key] = value }
      return dto
    }

    @JvmStatic
    fun fromLanguageFieldList(
        languageField: LanguageField<MutableList<String>>
    ): LanguageFieldDTO<List<String>> {
      val dto = LanguageFieldDTO<List<String>>()
      languageField.forEach { (key, value) -> dto[key] = value }
      return dto
    }
  }
}
