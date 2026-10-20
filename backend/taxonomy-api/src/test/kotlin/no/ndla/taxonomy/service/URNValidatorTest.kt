/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.domain.DomainEntity
import no.ndla.taxonomy.domain.exceptions.IdFormatException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.fail

class URNValidatorTest {
  @Test
  fun validate() {
    val urnValidator = URNValidator()

    urnValidator.validate(URI("urn:testentity:100"), TestEntity())

    try {
      urnValidator.validate(URI("http:testentity:100"), TestEntity())
      fail("Expected IdFormatException")
    } catch (exception: IdFormatException) {
      assertEquals("Id should start with urn:", exception.message)
    }

    try {
      urnValidator.validate(URI("urn:entity:100"), TestEntity())
      fail("Expected IdFormatException")
    } catch (exception: IdFormatException) {
      assertEquals("Id should contain entity name", exception.message)
    }

    try {
      urnValidator.validate(URI("urn:testentity"), TestEntity())
      fail("Expected IdFormatException")
    } catch (exception: IdFormatException) {
      assertEquals("Id should have id field", exception.message)
    }
  }

  private class TestEntity : DomainEntity()
}
