/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.ResourceType
import no.ndla.taxonomy.rest.v1.dtos.ResourceTypeDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class ResourceTypesTest : RestTest() {

  @Test
  fun can_get_all_resource_types() {
    val response = testUtils.getResource("/v1/resource-types")
    val resourceTypes = testUtils.getObject(Array<ResourceTypeDTO>::class.java, response)
    assertEquals(ResourceType.entries.size, resourceTypes.size)
    TestUtils.assertAllTrue(resourceTypes) { s -> TestUtils.isValidId(s.id) }
  }

  @Test
  fun can_get_resourcetype_by_id() {
    val id = ResourceType.SUBJECT_MATERIAL.publicId

    val response = testUtils.getResource("/v1/resource-types/$id")
    val resourceType = testUtils.getObject(ResourceTypeDTO::class.java, response)
    assertEquals(id, resourceType.id)
  }

  @Test
  fun can_get_all_resource_types_with_translation() {
    val response = testUtils.getResource("/v1/resource-types?language=nb")
    val resourceTypes = testUtils.getObject(Array<ResourceTypeDTO>::class.java, response)

    TestUtils.assertAnyTrue(resourceTypes) { s -> "Fagstoff" == s.name }
    TestUtils.assertAnyTrue(resourceTypes) { s -> "Oppgave" == s.name }
  }

  @Test
  fun can_get_resourcetype_by_id_with_translation() {
    val id = ResourceType.SUBJECT_MATERIAL.publicId

    val response = testUtils.getResource("/v1/resource-types/$id?language=nb")
    val resourceType = testUtils.getObject(ResourceTypeDTO::class.java, response)
    assertEquals("Fagstoff", resourceType.name)
  }

  @Test
  fun unknown_resourcetype_fails_gracefully() {
    testUtils.getResource("/v1/resource-types/doesnotexist", status().isNotFound())
  }
}
