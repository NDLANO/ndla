/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import java.net.URI
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.spy
import org.springframework.test.util.ReflectionTestUtils

class DomainEntityTest {
  private lateinit var domainEntity: DomainEntity

  @BeforeEach
  fun setUp() {
    domainEntity = spy(DomainEntity::class.java)
  }

  @Test
  fun getId() {
    ReflectionTestUtils.setField(domainEntity, "id", 1000)
    assertEquals(1000, domainEntity.id)
  }

  @Test
  fun getAndSetPublicId() {
    assertThrows<UninitializedPropertyAccessException> { domainEntity.publicId }
    domainEntity.publicId = URI("urn:test1")
    assertEquals(URI("urn:test1"), domainEntity.publicId)
  }
}
