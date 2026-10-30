/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.service.dtos.MetadataDTO
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class NodesMetadataTest : RestTest() {

  @BeforeEach
  fun clearAllRepos() {
    nodeRepository.deleteAllAndFlush()
  }

  @Test
  fun get_metadata_for_missing_node_fails() {
    testUtils.getResource("/v1/nodes/urn:node:1/metadata", status().isNotFound())
  }

  @Test
  fun can_get_metadata_for_node() {
    val publicId = builder.node().publicId

    val response = testUtils.getResource("/v1/nodes/$publicId/metadata")
    val metadata = testUtils.getObject(MetadataDTO::class.java, response)

    assertNotNull(metadata)
    assertTrue(metadata.visible)
  }

  @Test
  fun can_update_metadata_for_node() {
    val publicId = builder.node().publicId

    testUtils.updateResource(
        "/v1/nodes/$publicId/metadata",
        MetadataDTO(setOf("KM123"), false, mapOf("key" to "value")),
        status().isOk(),
    )

    val node = nodeRepository.getByPublicId(publicId)
    assertNotNull(node.metadata)
    assertFalse(node.metadata.isVisible())
    val codes = node.metadata.getGrepCodes().mapTo(HashSet()) { it.code }
    assertTrue(codes.contains("KM123"))
    val customFieldValues = node.metadata.getCustomFields()
    assertTrue(customFieldValues.containsKey("key"))
    assertTrue(customFieldValues.containsValue("value"))
  }

  @Test
  fun can_remove_metadata_for_node() {
    val publicId = builder.node { n -> n.customField("key", "value").grepCode("KM123") }.publicId

    testUtils.updateResource(
        "/v1/nodes/$publicId/metadata",
        MetadataDTO(setOf(), true, mapOf()),
        status().isOk(),
    )

    val node = nodeRepository.getByPublicId(publicId)
    assertNotNull(node.metadata)
    assertTrue(node.metadata.isVisible())
    assertTrue(node.metadata.getGrepCodes().isEmpty())
    assertTrue(node.getCustomFields().isEmpty())
  }
}
