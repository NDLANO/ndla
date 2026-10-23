/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import java.net.URI
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class UriTypeConverterTest {
  private lateinit var uriTypeConverter: UriTypeConverter

  @BeforeEach
  fun setUp() {
    uriTypeConverter = UriTypeConverter()
  }

  @Test
  fun convertToDatabaseColumn() {
    assertNull(uriTypeConverter.convertToDatabaseColumn(null))
    assertEquals("urn:test:1", uriTypeConverter.convertToDatabaseColumn(URI.create("urn:test:1")))
  }

  @Test
  fun convertToEntityAttribute() {
    assertNull(uriTypeConverter.convertToEntityAttribute(null))
    assertEquals(URI.create("urn:test:1"), uriTypeConverter.convertToEntityAttribute("urn:test:1"))
  }
}
