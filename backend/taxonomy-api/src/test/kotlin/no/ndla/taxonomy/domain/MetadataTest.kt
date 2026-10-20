/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.springframework.test.util.ReflectionTestUtils

class MetadataTest {
  private lateinit var metadata: Metadata

  @BeforeEach
  fun setUp() {
    val parent = Node(NodeType.RESOURCE)
    metadata = Metadata(parent)
  }

  @Test
  fun addGetAndRemoveGrepCode() {
    val grepCode1 = mock(JsonGrepCode::class.java)
    val grepCode2 = mock(JsonGrepCode::class.java)

    assertEquals(0, metadata.getGrepCodes().size)

    metadata.addGrepCode(grepCode1)

    assertEquals(1, metadata.getGrepCodes().size)
    assertTrue(metadata.getGrepCodes().contains(grepCode1))

    metadata.addGrepCode(grepCode2)

    assertEquals(2, metadata.getGrepCodes().size)
    assertTrue(metadata.getGrepCodes().contains(grepCode1))
    assertTrue(metadata.getGrepCodes().contains(grepCode2))

    metadata.removeGrepCode(grepCode1)

    assertEquals(1, metadata.getGrepCodes().size)
    assertTrue(metadata.getGrepCodes().contains(grepCode2))

    metadata.removeGrepCode(grepCode2)

    assertEquals(0, metadata.getGrepCodes().size)
  }

  @Test
  fun isVisible() {
    assertTrue(metadata.isVisible())

    ReflectionTestUtils.setField(metadata, "visible", false)
    assertFalse(metadata.isVisible())

    ReflectionTestUtils.setField(metadata, "visible", true)
    assertTrue(metadata.isVisible())
  }

  @Test
  fun setVisible() {
    assertTrue(ReflectionTestUtils.getField(metadata, "visible") as Boolean)

    metadata.setVisible(false)
    assertFalse(ReflectionTestUtils.getField(metadata, "visible") as Boolean)

    metadata.setVisible(true)
    assertTrue(ReflectionTestUtils.getField(metadata, "visible") as Boolean)
  }
}
