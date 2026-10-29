/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertNull
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@ExtendWith(SpringExtension::class)
class ContextUpdaterServiceTest : AbstractIntegrationTest() {
  private lateinit var service: ContextUpdaterService

  private lateinit var nodeRepository: NodeRepository
  private lateinit var nodeConnectionRepository: NodeConnectionRepository

  @BeforeEach
  fun setup(
      @Autowired nodeRepository: NodeRepository,
      @Autowired nodeConnectionRepository: NodeConnectionRepository,
  ) {
    this.nodeRepository = nodeRepository
    this.nodeConnectionRepository = nodeConnectionRepository

    this.nodeRepository.deleteAllAndFlush()
    this.nodeConnectionRepository.deleteAllAndFlush()

    service = ContextUpdaterService(nodeConnectionRepository)
  }

  @Test
  @Transactional
  fun updateCachedUrls() {
    val subject1 = Node(NodeType.SUBJECT)
    subject1.publicId = URI.create("urn:subject:1")
    subject1.name = "Subject1"
    subject1.isContext = true

    nodeRepository.save(subject1)

    service.updateContexts(subject1)

    run {
      assertEquals(1, subject1.contexts.size)
      val context = subject1.contexts.first()
      assertEquals("/subject:1", context.path)
      assertEquals("urn:subject:1", context.rootId)
      assertEquals(0, context.breadcrumbs.size)
      assertTrue(context.isPrimary)

      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:subject:1")))
      assertEquals(1, node.contexts.size)
    }

    val topic1 = Node(NodeType.TOPIC)
    topic1.publicId = URI.create("urn:topic:1")
    topic1.name = "Topic1"
    topic1.isContext = true

    nodeRepository.save(topic1)

    service.updateContexts(topic1)

    run {
      assertEquals(1, topic1.contexts.size)
      val context = topic1.contexts.first()
      assertEquals("/topic:1", context.path)
      assertEquals("urn:topic:1", context.rootId)
      assertEquals(0, context.breadcrumbs.size)
      assertTrue(context.isPrimary)

      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:topic:1")))
      assertEquals(1, node.contexts.size)
    }

    val nc = NodeConnection.create(subject1, topic1, Relevance.CORE)
    nodeConnectionRepository.save(nc)
    topic1.addParentConnection(nc)

    service.updateContexts(topic1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:topic:1")))
      assertEquals(2, node.contexts.size)
      assertTrue(node.contexts.map { it.path }.containsAll(setOf("/topic:1", "/subject:1/topic:1")))
    }

    topic1.isContext = false

    service.updateContexts(topic1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:topic:1")))
      assertEquals(1, node.contexts.size)
      assertTrue(node.contexts.map { it.path }.contains("/subject:1/topic:1"))
    }

    val topic2 = Node(NodeType.TOPIC)
    topic2.publicId = URI.create("urn:topic:2")
    topic2.name = "Topic2"
    nodeRepository.save(topic2)

    service.updateContexts(topic1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:topic:2")))
      assertEquals(0, node.contexts.size)
    }

    val nc2 = NodeConnection.create(topic1, topic2, Relevance.CORE)
    topic1.addChildConnection(nc2)
    nodeConnectionRepository.save(nc2)

    service.updateContexts(topic1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:topic:2")))
      assertEquals(1, node.contexts.size)
      assertTrue(node.contexts.map { it.path }.contains("/subject:1/topic:1/topic:2"))
    }

    topic1.isContext = true

    service.updateContexts(topic1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:topic:2")))
      assertEquals(2, node.contexts.size)
      assertTrue(
          node.contexts
              .map { it.path }
              .containsAll(setOf("/subject:1/topic:1/topic:2", "/topic:1/topic:2")))
    }

    val resource1 = Node(NodeType.RESOURCE)
    resource1.publicId = URI.create("urn:resource:1")
    nodeRepository.save(resource1)

    service.updateContexts(resource1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:resource:1")))
      assertEquals(0, node.contexts.size)
    }

    val nc3 = NodeConnection.create(topic1, resource1, Relevance.CORE)
    nodeConnectionRepository.save(nc3)
    topic1.addChildConnection(nc3)

    service.updateContexts(resource1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:resource:1")))
      assertEquals(2, node.contexts.size)
      assertTrue(
          node.contexts
              .map { it.path }
              .containsAll(setOf("/subject:1/topic:1/resource:1", "/topic:1/resource:1")))
    }

    val nc4 = NodeConnection.create(topic2, resource1, Relevance.CORE)
    nodeConnectionRepository.save(nc4)
    topic2.addChildConnection(nc4)

    service.updateContexts(resource1)

    run {
      val node = requireNotNull(nodeRepository.findFirstByPublicId(URI.create("urn:resource:1")))
      assertEquals(4, node.contexts.size)
      assertTrue(
          node.contexts
              .map { it.path }
              .containsAll(
                  setOf(
                      "/subject:1/topic:1/resource:1",
                      "/topic:1/resource:1",
                      "/subject:1/topic:1/topic:2/resource:1",
                      "/topic:1/topic:2/resource:1",
                  )))
    }

    nodeRepository.delete(resource1)

    run {
      val node = nodeRepository.findFirstByPublicId(URI.create("urn:resource:1"))
      assertNull(node)
    }
  }

  @Test
  fun clearCachedUrls() {
    val subject1 = Node(NodeType.SUBJECT)
    subject1.publicId = URI.create("urn:subject:1")
    subject1.isContext = true

    nodeRepository.save(subject1)

    service.updateContexts(subject1)

    assertEquals(1, subject1.contexts.size)

    service.clearContexts(subject1)

    assertEquals(0, subject1.contexts.size)
  }
}
