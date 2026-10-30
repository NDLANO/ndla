/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.rest.v1.dtos.ContextDTO
import no.ndla.taxonomy.rest.v1.dtos.ContextPOST
import no.ndla.taxonomy.service.dtos.NodeDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class ContextsTest : RestTest() {

  @BeforeEach
  fun cleanDatabase() {
    nodeRepository.deleteAllAndFlush()
  }

  @Test
  fun all_subjects_are_contexts() {
    builder.node { s ->
      s.nodeType(NodeType.SUBJECT).publicId("urn:subject:1").isContext(true).name("Subject 1")
    }

    val response = testUtils.getResource("/v1/contexts")
    val contexts = testUtils.getObject(Array<ContextDTO>::class.java, response)

    assertEquals(1, contexts.size)
    assertEquals("urn:subject:1", contexts[0].id.toString())
    assertEquals("/subject:1", contexts[0].path)
    assertEquals("Subject 1", contexts[0].name)
  }

  @Test
  fun topics_can_be_contexts() {
    builder.node { t ->
      t.nodeType(NodeType.TOPIC).publicId("urn:topic:1").name("Topic 1").isContext(true)
    }

    val response = testUtils.getResource("/v1/contexts")
    val contexts = testUtils.getObject(Array<ContextDTO>::class.java, response)

    assertEquals(1, contexts.size)
    assertEquals("urn:topic:1", contexts[0].id.toString())
    assertEquals("/topic:1", contexts[0].path)
    assertEquals("Topic 1", contexts[0].name)
  }

  @Test
  fun can_add_topic_as_context() {
    val topic = builder.node { t -> t.nodeType(NodeType.TOPIC).publicId("urn:topic:ct:2") }

    testUtils.createResource("/v1/contexts", ContextPOST(topic.publicId))

    assertTrue(topic.isContext)
  }

  @Test
  fun can_remove_topic_as_context() {
    val topic =
        builder.node { t -> t.nodeType(NodeType.TOPIC).publicId("urn:topic:1").isContext(true) }

    testUtils.deleteResource("/v1/contexts/urn:topic:1")
    assertFalse(topic.isContext)
  }

  @Test
  fun can_get_translated_contexts() {
    nodeRepository.deleteAllAndFlush()

    builder.node { s ->
      s.nodeType(NodeType.SUBJECT)
          .isContext(true)
          .publicId("urn:subject:1")
          .name("Subject 1")
          .translation("Fag 1", "nb")
    }

    builder.node { t ->
      t.nodeType(NodeType.TOPIC)
          .publicId("urn:topic:1")
          .name("Topic 1")
          .translation("Emne 1", "nb")
          .isContext(true)
    }

    val response = testUtils.getResource("/v1/contexts?language=nb")
    val contexts = testUtils.getObject(Array<ContextDTO>::class.java, response)

    assertEquals(2, contexts.size)

    TestUtils.assertAnyTrue(contexts) { c -> "Emne 1" == c.name }
    TestUtils.assertAnyTrue(contexts) { c -> "Fag 1" == c.name }
  }

  // TODO Set is not ordered
  @Test
  fun root_context_is_more_important_than_primary_parent() {
    val topic = builder.node { t -> t.nodeType(NodeType.TOPIC).publicId("urn:topic:1") }

    builder.node { s ->
      s.nodeType(NodeType.SUBJECT).isContext(true).publicId("urn:subject:1").child(topic)
    }

    topic.isContext = true
    nodeRepository.saveAndFlush(topic)

    contextUpdaterService.updateContexts(topic)

    val response = testUtils.getResource("/v1/nodes/urn:topic:1")
    val topicIndexDocument = testUtils.getObject(NodeDTO::class.java, response)
    TestUtils.assertAnyTrue(topicIndexDocument.paths) { p -> "/topic:1" == p }
  }
}
