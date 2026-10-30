/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.ResourceType
import no.ndla.taxonomy.rest.v1.dtos.ResourceResourceTypeDTO
import no.ndla.taxonomy.rest.v1.dtos.ResourceResourceTypePOST
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class ResourceResourceTypesTest : RestTest() {

  @Test
  fun can_add_resourcetype_to_resource() {
    val createdResource = newResource()
    createdResource.name = "Introduction to integration"
    val integrationResourceId = createdResource.publicId

    val rt = ResourceType.SUBJECT_MATERIAL
    val textTypeId = rt.publicId

    val id =
        TestUtils.getId(
            testUtils.createResource(
                "/v1/resource-resourcetypes",
                ResourceResourceTypePOST(integrationResourceId, textTypeId),
            ))

    val resource = nodeRepository.getByPublicId(integrationResourceId)
    assertEquals(1, resource.resourceTypes.size)
    TestUtils.assertAnyTrue(resource.resourceTypes) { t -> "Fagstoff" == t.getTranslatedName("nb") }
    assertNotNull(id)
  }

  @Test
  fun cannot_have_duplicate_resourcetypes_for_resource() {
    val integrationResource = newResource()
    integrationResource.name = "Introduction to integration"

    val resourceType = ResourceType.SUBJECT_MATERIAL
    integrationResource.addResourceType(resourceType)
    save(integrationResource)

    testUtils.createResource(
        "/v1/resource-resourcetypes",
        ResourceResourceTypePOST(integrationResource.publicId, resourceType.publicId),
        status().isConflict(),
    )
  }

  @Test
  fun can_delete_resource_resourcetype() {
    val integrationResource =
        builder.node(NodeType.RESOURCE) { r -> r.name("Introduction to integration") }
    integrationResource.addResourceType(ResourceType.DOCUMENTARY)
    save(integrationResource)

    testUtils.deleteResource(
        "/v1/resource-resourcetypes/urn:resource-resourcetype:${integrationResource.publicId}_${ResourceType.DOCUMENTARY.publicId}")
    val node = nodeRepository.getByPublicId(integrationResource.publicId)
    assertEquals(0, node.resourceTypes.size)
  }

  @Test
  fun can_list_all_resource_resourcetypes() {
    val trigonometry = newResource()
    trigonometry.name = "Advanced trigonometry"
    trigonometry.addResourceType(ResourceType.DOCUMENTARY)
    save(trigonometry)

    val integration = newResource()
    integration.name = "Introduction to integration"
    integration.addResourceType(ResourceType.REVIEW_RESOURCE)
    save(integration)

    val response = testUtils.getResource("/v1/resource-resourcetypes")
    val resourceResourcetypes =
        testUtils.getObject(Array<ResourceResourceTypeDTO>::class.java, response)
    assertEquals(2, resourceResourcetypes.size)
    TestUtils.assertAnyTrue(resourceResourcetypes) { t ->
      trigonometry.publicId == t.resourceId && ResourceType.DOCUMENTARY.publicId == t.resourceTypeId
    }
    TestUtils.assertAnyTrue(resourceResourcetypes) { t ->
      integration.publicId == t.resourceId &&
          ResourceType.REVIEW_RESOURCE.publicId == t.resourceTypeId
    }
  }

  @Test
  fun can_get_a_resource_resourcetype() {
    val resource = newResource()
    resource.name = "Advanced trigonometry"
    val resourceType = ResourceType.SUBJECT_MATERIAL
    resource.addResourceType(resourceType)
    save(resource)

    val response =
        testUtils.getResource(
            "/v1/resource-resourcetypes/urn:resource-resourcetype:${resource.publicId}_${resourceType.publicId}")
    val result = testUtils.getObject(ResourceResourceTypeDTO::class.java, response)

    assertEquals(resource.publicId, result.resourceId)
    assertEquals(resourceType.publicId, result.resourceTypeId)
  }
}
