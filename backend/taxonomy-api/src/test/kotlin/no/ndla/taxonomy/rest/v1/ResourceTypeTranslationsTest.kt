/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import java.net.URI
import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.ResourceType
import no.ndla.taxonomy.rest.v1.dtos.ResourceTypeDTO
import no.ndla.taxonomy.service.dtos.TranslationDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class ResourceTypeTranslationsTest : RestTest() {

  @Test
  fun can_get_all_resource_types() {
    val response = testUtils.getResource("/v1/resource-types?language=nb")
    val resourceTypes = testUtils.getObject(Array<ResourceTypeDTO>::class.java, response)

    TestUtils.assertAnyTrue(resourceTypes) { s -> "Fagstoff" == s.name }
  }

  @Test
  fun can_get_single_resource_type() {
    val id = ResourceType.SUBJECT_MATERIAL.publicId

    val resourceType = getResourceTypeIndexDocument(id, "nb")
    assertEquals("Fagstoff", resourceType.name)
  }

  @Test
  fun fallback_to_default_language() {
    val id = ResourceType.SUBJECT_MATERIAL.publicId

    val resourceType = getResourceTypeIndexDocument(id, "XX")
    assertEquals("Fagstoff", resourceType.name)
  }

  @Test
  fun can_get_default_language() {
    val id = ResourceType.SUBJECT_MATERIAL.publicId

    val resourceType = getResourceTypeIndexDocument(id, null)
    assertEquals("Fagstoff", resourceType.name)
  }

  @Test
  fun can_get_all_translations() {
    val id = ResourceType.SUBJECT_MATERIAL.publicId
    val translations =
        testUtils.getObject(
            Array<TranslationDTO>::class.java,
            testUtils.getResource("/v1/resource-types/$id/translations"),
        )

    assertEquals(4, translations.size)
    TestUtils.assertAnyTrue(translations) { t -> "Fagstoff" == t.name && "nb" == t.language }
    TestUtils.assertAnyTrue(translations) { t ->
      "Subject Material" == t.name && "en" == t.language
    }
  }

  @Test
  fun can_get_single_translation() {
    val id = ResourceType.SUBJECT_MATERIAL.publicId
    val translation =
        testUtils.getObject(
            TranslationDTO::class.java,
            testUtils.getResource("/v1/resource-types/$id/translations/nb"),
        )

    assertEquals("Fagstoff", translation.name)
    assertEquals("nb", translation.language)
  }

  private fun getResourceTypeIndexDocument(id: URI, language: String?): ResourceTypeDTO {
    var path = "/v1/resource-types/$id"
    if (!language.isNullOrEmpty()) path = "$path?language=$language"
    return testUtils.getObject(ResourceTypeDTO::class.java, testUtils.getResource(path))
  }
}
