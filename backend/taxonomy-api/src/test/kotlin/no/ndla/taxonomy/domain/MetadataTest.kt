/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import no.ndla.taxonomy.rest.v1.dtos.MetadataPUT
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class MetadataTest {
  private lateinit var node: Node

  @BeforeEach
  fun setUp() {
    node = Node(NodeType.RESOURCE)
  }

  @Test
  fun addGetAndRemoveGrepCode() {
    val grepCode1 = JsonGrepCode("KM1")
    val grepCode2 = JsonGrepCode("KM2")

    assertEquals(emptySet<JsonGrepCode>(), node.metadata.grepCodes)

    node.addGrepCode(grepCode1)
    assertEquals(setOf(grepCode1), node.metadata.grepCodes)

    node.addGrepCode(grepCode2)
    assertEquals(setOf(grepCode1, grepCode2), node.metadata.grepCodes)

    node.removeGrepCode(grepCode1)
    assertEquals(setOf(grepCode2), node.metadata.grepCodes)

    node.removeGrepCode(grepCode2)
    assertEquals(emptySet<JsonGrepCode>(), node.metadata.grepCodes)
  }

  @Test
  fun visibilityIsReflectedInMetadata() {
    assertTrue(node.metadata.isVisible)

    node.isVisible = false
    assertFalse(node.metadata.isVisible)

    node.isVisible = true
    assertTrue(node.metadata.isVisible)
  }

  @Test
  fun metadataIsASnapshot() {
    val before = node.metadata
    node.isVisible = false
    node.addGrepCode(JsonGrepCode("KM1"))

    assertTrue(before.isVisible)
    assertTrue(before.grepCodes.isEmpty())
  }

  @Test
  fun updateMetadataOnlyChangesPresentFields() {
    node.setCustomField("key", "value")
    node.addGrepCode(JsonGrepCode("KM1"))

    val result = node.updateMetadata(MetadataPUT(visible = false))

    assertFalse(result.isVisible)
    assertEquals(setOf("KM1"), result.grepCodes.map { it.code }.toSet())
    assertEquals(mapOf("key" to "value"), result.customFields)

    val replaced = node.updateMetadata(MetadataPUT(grepCodes = setOf("KM2", "KM3")))
    assertEquals(setOf("KM2", "KM3"), replaced.grepCodes.map { it.code }.toSet())
    assertEquals(replaced, node.metadata)
  }

  @Test
  fun setMetadataCopiesAllFields() {
    node.isVisible = false
    node.addGrepCode(JsonGrepCode("KM1"))
    node.setCustomField("key", "value")

    val copy = Node(NodeType.RESOURCE)
    copy.setMetadata(node.metadata)

    assertEquals(node.metadata, copy.metadata)
  }
}
