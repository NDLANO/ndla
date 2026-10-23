/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import jakarta.persistence.Column
import jakarta.persistence.MappedSuperclass
import kotlin.jvm.optionals.getOrNull

@MappedSuperclass
abstract class DomainObject : DomainEntity(), Translatable {
  @Column var name: String? = null

  fun getTranslatedName(languageCode: String): String? =
      getTranslation(languageCode).getOrNull()?.name ?: name
}
