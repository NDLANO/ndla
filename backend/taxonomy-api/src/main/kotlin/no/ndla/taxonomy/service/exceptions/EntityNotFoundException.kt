/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.exceptions

class EntityNotFoundException(id: String) : Exception("Entity not found: $id") {
  constructor(id: Int?) : this(id?.toString() ?: "null")
}
