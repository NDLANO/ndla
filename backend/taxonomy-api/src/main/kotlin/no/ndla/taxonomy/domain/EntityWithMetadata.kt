/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import java.time.Instant

interface EntityWithMetadata {
  val metadata: Metadata

  var grepCodes: Set<JsonGrepCode>
  var customFields: Map<String, String>
  var isVisible: Boolean
  var createdAt: Instant?
  var updatedAt: Instant?

  fun setCustomField(key: String, value: String) {
    customFields += key to value
  }

  fun unsetCustomField(key: String) {
    customFields -= key
  }

  fun setMetadata(metadata: Metadata, changeOwner: Boolean) {
    customFields = metadata.getCustomFields()
    grepCodes = metadata.getGrepCodes()
    isVisible = metadata.isVisible()
    updatedAt = metadata.getUpdatedAt()
    createdAt = metadata.getCreatedAt()
    if (changeOwner) {
      metadata.setParent(this)
    }
  }

  fun setMetadata(metadata: Metadata) {
    this.setMetadata(metadata, true)
  }
}
