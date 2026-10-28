/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.test.util.ReflectionTestUtils.getField
import org.springframework.test.util.ReflectionTestUtils.setField

class CustomFieldTest {
  private lateinit var customField: CustomField

  @BeforeEach
  fun setUp() {
    customField = CustomField()
  }

  @Test
  fun getId() {
    val id = 1
    setField(customField, "id", id)
    assertEquals(id, customField.id)
  }

  @Test
  fun setId() {
    val id = 1
    customField.id = id
    assertEquals(id, getField(customField, "id"))
  }

  @Test
  fun getKey() {
    setField(customField, "key", "key")
    assertEquals("key", customField.key)
  }

  @Test
  fun setKey() {
    customField.key = "key"
    assertEquals("key", getField(customField, "key"))
  }
}
