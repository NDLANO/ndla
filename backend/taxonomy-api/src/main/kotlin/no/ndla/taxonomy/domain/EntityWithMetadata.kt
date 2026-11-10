/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import java.time.Instant
import no.ndla.taxonomy.rest.v1.dtos.MetadataPUT

interface EntityWithMetadata {
  var grepCodes: Set<JsonGrepCode>
  var customFields: Map<String, String>
  var isVisible: Boolean
  var createdAt: Instant?
  var updatedAt: Instant?

  val metadata: Metadata
    get() = Metadata(grepCodes, customFields, isVisible, createdAt, updatedAt)

  fun setMetadata(metadata: Metadata) {
    grepCodes = metadata.grepCodes
    customFields = metadata.customFields
    isVisible = metadata.isVisible
    createdAt = metadata.createdAt
    updatedAt = metadata.updatedAt
  }

  /** Applies the fields present in [update] and returns the resulting metadata. */
  fun updateMetadata(update: MetadataPUT): Metadata {
    update.visible?.let { isVisible = it }
    update.grepCodes?.let { codes -> grepCodes = codes.mapTo(mutableSetOf()) { JsonGrepCode(it) } }
    update.customFields?.let { customFields = it }
    return metadata
  }

  fun addGrepCode(grepCode: JsonGrepCode) {
    grepCodes += grepCode
  }

  fun removeGrepCode(grepCode: JsonGrepCode) {
    grepCodes -= grepCode
  }

  fun setCustomField(key: String, value: String) {
    customFields += key to value
  }

  fun unsetCustomField(key: String) {
    customFields -= key
  }
}
