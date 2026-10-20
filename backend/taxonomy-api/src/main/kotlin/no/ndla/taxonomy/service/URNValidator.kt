/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import java.util.regex.Pattern
import no.ndla.taxonomy.domain.DomainEntity
import no.ndla.taxonomy.domain.exceptions.IdFormatException

class URNValidator {
  fun validate(id: URI, entity: DomainEntity) {
    val idParts = COLON.split(id.toString())
    if ("urn" != idParts[0]) {
      throw IdFormatException("Id should start with urn:")
    }
    if (idParts[1] != entity.entityName) {
      throw IdFormatException("Id should contain entity name")
    }
    if (idParts.size < 3) {
      throw IdFormatException("Id should have id field")
    }
  }

  companion object {
    private val COLON: Pattern = Pattern.compile(":")
  }
}
