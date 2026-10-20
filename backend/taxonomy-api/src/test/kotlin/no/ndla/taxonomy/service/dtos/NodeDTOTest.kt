/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.dtos

import java.time.Instant
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.test.util.ReflectionTestUtils.getField

class NodeDTOTest {

  @Test
  fun defaultUrlNameUsesDefaultLanguageTranslation() {
    val node = Node(NodeType.TOPIC)
    node.name = "English base name"
    node.addTranslation("Bokmal default name", "nb")
    node.setUpdatedAt(Instant.now())

    val dto =
        NodeDTO(null, null, node, NodeConnectionType.BRANCH, "en", null, false, false, true, false)

    assertEquals("bokmal-default-name", getField(dto, "defaultUrlName"))
  }
}
