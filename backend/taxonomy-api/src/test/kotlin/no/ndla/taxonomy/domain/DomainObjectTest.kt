/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.spy

class DomainObjectTest {
  private lateinit var domainObject: DomainObject

  @BeforeEach
  fun setUp() {
    this.domainObject = spy(DomainObject::class.java)
  }

  @Test
  fun setAndGetName() {
    assertNull(domainObject.name)

    domainObject.name = "testname"
    assertEquals("testname", domainObject.name)
  }
}
