/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain.exceptions

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.NOT_FOUND)
class NotFoundException : RuntimeException {
  constructor(type: String, id: Any?) : super("$type with id $id not found")

  constructor(url: String) : super("Element with url $url not found")
}
