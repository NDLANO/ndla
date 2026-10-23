/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class NodeUrlNameTest {

  @Test
  fun translatedPrettyNamesSkipsNullTranslationNames() {
    val node = Node(NodeType.TOPIC)
    node.name = "Default Name"
    node.addTranslation(JsonTranslation(null, "nn"))

    assertEquals(setOf("default-name"), node.translatedPrettyNames())
  }
}
