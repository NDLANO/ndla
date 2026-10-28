/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import io.hypersistence.utils.hibernate.type.util.ObjectMapperWrapper
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class TaxonomyContextTest {
  private val storedContext =
      """
      {"name": {"en": "Supplementary programme", "nb": "Påbygg", "nn": "Påbygg", "se": "Lasáhus"},
       "path": "/programme:a105b3a3-7a29-49be-817b-803c06892237", "rank": 0,
       "rootId": "urn:programme:a105b3a3-7a29-49be-817b-803c06892237", "parents": null,
       "isActive": true, "nodeType": "PROGRAMME",
       "publicId": "urn:programme:a105b3a3-7a29-49be-817b-803c06892237",
       "rootName": {"en": "Supplementary programme", "nb": "Påbygg", "nn": "Påbygg", "se": "Lasáhus"},
       "contextId": "6ea1ed34e5e7", "isPrimary": true, "isVisible": true, "parentIds": [],
       "isArchived": false, "breadcrumbs": {}, "contextType": null,
       "relevanceId": "urn:relevance:core", "connectionId": "", "parentContextIds": []}
      """

  @Test
  fun stored_context_with_null_parents_can_be_read() {
    val context =
        ObjectMapperWrapper.INSTANCE.fromString(storedContext, TaxonomyContext::class.java)

    assertEquals("urn:programme:a105b3a3-7a29-49be-817b-803c06892237", context.publicId)
    assertNull(context.parents)
    assertNull(context.contextType)
  }

  @Test
  fun stored_context_without_parents_can_be_read() {
    val json = storedContext.replace("\"parents\": null,", "")
    val context = ObjectMapperWrapper.INSTANCE.fromString(json, TaxonomyContext::class.java)

    assertEquals("6ea1ed34e5e7", context.contextId)
    assertNull(context.parents)
  }
}
