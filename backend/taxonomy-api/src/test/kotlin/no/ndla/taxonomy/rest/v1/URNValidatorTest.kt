/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import java.net.URI
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.exceptions.IdFormatException
import no.ndla.taxonomy.service.URNValidator
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class URNValidatorTest {
  private lateinit var validator: URNValidator
  private lateinit var entity: Node

  @BeforeEach
  fun setUp() {
    validator = URNValidator()
    entity = Node(NodeType.TOPIC)
  }

  @Test
  fun urnWithOutURNIsRejected() {
    val id = URI.create("topic:1")

    assertThrows<IdFormatException>("Id should start with urn:") { validator.validate(id, entity) }
  }

  @Test
  fun urnWithoutEntityIsRejected() {
    val id = URI.create("urn:wrong:1")

    assertThrows<IdFormatException>("Id should have entity name") { validator.validate(id, entity) }
  }

  @Test
  fun urnMustHaveID() {
    val id = URI.create("urn:topic")

    assertThrows<IdFormatException>("Id should have id field") { validator.validate(id, entity) }
  }

  @Test
  fun validURIPasses() {
    val id = URI.create("urn:topic:2")

    validator.validate(id, entity)
  }

  @Test
  fun uriCanHaveVersionField() {
    val id = URI.create("urn:topic:1:134")

    validator.validate(id, entity)
  }

  @Test
  fun listingStyleURIIsAccepted() {
    val id = URI.create("urn:resource:1:verktoy:blikkenslageren")
    validator.validate(id, Node(NodeType.RESOURCE))
  }

  @Test
  fun differentEntityClassesAreAccepted() {
    val id = URI.create("urn:subject:134")
    validator.validate(id, Node(NodeType.SUBJECT))
  }
}
