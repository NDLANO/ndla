/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.TestSeeder
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.fail
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertNotNull
import org.junit.jupiter.api.assertNull
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class RecursiveNodeTreeServiceTest : AbstractIntegrationTest() {
  private lateinit var nodeRepository: NodeRepository
  private lateinit var nodeConnectionRepository: NodeConnectionRepository

  private lateinit var service: RecursiveNodeTreeService
  private lateinit var core: Relevance

  @BeforeEach
  fun setUp(
      @Autowired nodeConnectionRepository: NodeConnectionRepository,
      @Autowired nodeRepository: NodeRepository,
      @Autowired testSeeder: TestSeeder,
  ) {
    this.nodeRepository = nodeRepository
    this.nodeConnectionRepository = nodeConnectionRepository

    nodeRepository.deleteAllAndFlush()

    core = testSeeder.recursiveNodesBySubjectNodeIdTestSetup()

    service = RecursiveNodeTreeService(nodeConnectionRepository)
  }

  @Test
  fun getRecursiveTopics_by_subject() {
    val subject = nodeRepository.findFirstByPublicId(URI.create("urn:subject:1"))!!
    val recursiveNodes = service.getRecursiveNodes(subject)

    val nodesToFind =
        hashSetOf(
            "urn:subject:1",
            "urn:topic:1",
            "urn:topic:2",
            "urn:topic:3",
            "urn:topic:4",
            "urn:topic:5",
            "urn:topic:6",
            "urn:topic:7",
            "urn:topic:8",
        )

    val topic1 = nodeRepository.findFirstByPublicId(URI.create("urn:topic:1"))!!
    val topic3 = nodeRepository.findFirstByPublicId(URI.create("urn:topic:3"))!!
    val topic5 = nodeRepository.findFirstByPublicId(URI.create("urn:topic:5"))!!

    recursiveNodes.forEach { topicTreeElement ->
      val node = nodeRepository.findFirstByPublicId(topicTreeElement.id)!!

      if (!nodesToFind.contains(node.publicId.toString())) {
        fail<Nothing>("Topic found is unknown or duplicated ${node.publicId}")
      }

      when (node.publicId.toString()) {
        "urn:subject:1" -> {
          // Root node
          assertEquals(subject.publicId, topicTreeElement.id)
          assertNull(topicTreeElement.parentId)
        }
        "urn:topic:1" -> {
          // Child if subject
          assertEquals(subject.publicId, topicTreeElement.parentId)
          assertNotNull(topicTreeElement.parentId)
          assertEquals(1, topicTreeElement.rank)
        }
        "urn:topic:2" -> {
          // Child of topic 1
          assertNotNull(topicTreeElement.parentId)
          assertEquals(topic1.publicId, topicTreeElement.parentId)
          assertEquals(1, topicTreeElement.rank)
        }
        "urn:topic:3" -> {
          // Child if subject
          assertEquals(subject.publicId, topicTreeElement.parentId)
          assertNotNull(topicTreeElement.parentId)
          assertEquals(2, topicTreeElement.rank)
        }
        "urn:topic:4" -> {
          // Child of topic 3
          assertNotNull(topicTreeElement.parentId)
          assertEquals(topic3.publicId, topicTreeElement.parentId)
          assertEquals(1, topicTreeElement.rank)
        }
        "urn:topic:5" -> {
          // Child if subject
          assertEquals(subject.publicId, topicTreeElement.parentId)
          assertNotNull(topicTreeElement.parentId)
          assertEquals(3, topicTreeElement.rank)
        }
        "urn:topic:6" -> {
          // Child of topic 5
          assertNotNull(topicTreeElement.parentId)
          assertEquals(topic5.publicId, topicTreeElement.parentId)
          assertEquals(1, topicTreeElement.rank)
        }
        "urn:topic:7" -> {
          // Child of topic 5
          assertNotNull(topicTreeElement.parentId)
          assertEquals(topic5.publicId, topicTreeElement.parentId)
          assertEquals(2, topicTreeElement.rank)
        }
        "urn:topic:8" -> {
          // Child of topic 5
          assertNotNull(topicTreeElement.parentId)
          assertEquals(topic5.publicId, topicTreeElement.parentId)
          assertEquals(3, topicTreeElement.rank)
        }
        else -> fail()
      }

      nodesToFind.remove(node.publicId.toString())
    }

    assertEquals(0, nodesToFind.size)
  }

  @Test
  fun getRecursiveTopics_by_topic() {

    val topic1 = nodeRepository.findFirstByPublicId(URI.create("urn:topic:1"))!!
    val topic3 = nodeRepository.findFirstByPublicId(URI.create("urn:topic:3"))!!
    val topic5 = nodeRepository.findFirstByPublicId(URI.create("urn:topic:5"))!!

    // Search for subtopics of topic1
    run {
      val topicElements = service.getRecursiveNodes(topic1)
      val topicsToFind = hashSetOf("urn:topic:1", "urn:topic:2")

      topicElements.forEach { topicTreeElement ->
        val topic = nodeRepository.findFirstByPublicId(topicTreeElement.id)!!

        if (!topicsToFind.contains(topic.publicId.toString())) {
          fail<Nothing>("Topic found is unknown or duplicated ${topic.publicId}")
        }

        when (topic.publicId.toString()) {
          "urn:topic:1" -> {
            assertNull(topicTreeElement.parentId)
            assertEquals(0, topicTreeElement.rank)
          }
          "urn:topic:2" -> {
            assertNotNull(topicTreeElement.parentId)
            assertEquals(topic1.publicId, topicTreeElement.parentId)
            assertEquals(1, topicTreeElement.rank)
          }
          else -> fail()
        }

        topicsToFind.remove(topic.publicId.toString())
      }

      assertEquals(0, topicsToFind.size)
    }

    // Search for subtopics of topic3
    run {
      val topicElements = service.getRecursiveNodes(topic3)
      val topicsToFind = hashSetOf("urn:topic:3", "urn:topic:4")

      topicElements.forEach { topicTreeElement ->
        val topic = nodeRepository.findFirstByPublicId(topicTreeElement.id)!!

        if (!topicsToFind.contains(topic.publicId.toString())) {
          fail<Nothing>("Topic found is unknown or duplicated ${topic.publicId}")
        }

        when (topic.publicId.toString()) {
          "urn:topic:3" -> {
            assertNull(topicTreeElement.parentId)
            assertEquals(0, topicTreeElement.rank)
          }
          "urn:topic:4" -> {
            assertNotNull(topicTreeElement.parentId)
            assertEquals(topic3.publicId, topicTreeElement.parentId)
            assertEquals(1, topicTreeElement.rank)
          }
          else -> fail()
        }

        topicsToFind.remove(topic.publicId.toString())
      }

      assertEquals(0, topicsToFind.size)
    }

    // Search for subtopics of topic5
    run {
      val topicElements = service.getRecursiveNodes(topic5)
      val topicsToFind = hashSetOf("urn:topic:5", "urn:topic:6", "urn:topic:7", "urn:topic:8")

      topicElements.forEach { topicTreeElement ->
        val topic = nodeRepository.findFirstByPublicId(topicTreeElement.id)!!

        if (!topicsToFind.contains(topic.publicId.toString())) {
          fail<Nothing>("Topic found is unknown or duplicated ${topic.publicId}")
        }

        when (topic.publicId.toString()) {
          "urn:topic:5" -> {
            assertNull(topicTreeElement.parentId)
            assertEquals(0, topicTreeElement.rank)
          }
          "urn:topic:6" -> {
            assertNotNull(topicTreeElement.parentId)
            assertEquals(topic5.publicId, topicTreeElement.parentId)
            assertEquals(1, topicTreeElement.rank)
          }
          "urn:topic:7" -> {
            assertNotNull(topicTreeElement.parentId)
            assertEquals(topic5.publicId, topicTreeElement.parentId)
            assertEquals(2, topicTreeElement.rank)
          }
          "urn:topic:8" -> {
            assertNotNull(topicTreeElement.parentId)
            assertEquals(topic5.publicId, topicTreeElement.parentId)
            assertEquals(3, topicTreeElement.rank)
          }
          else -> fail()
        }

        topicsToFind.remove(topic.publicId.toString())
      }

      assertEquals(0, topicsToFind.size)
    }
  }

  @Test
  fun getRecursiveTopics_with_infinite_loop() {
    // This condition should not be possible as validation when inserting should prevent it,
    // this test tests that the breaker works in case it happens, for example by manual editing.
    // Otherwise it would result in a StackOverflowError at some point

    val topic1 = Node(NodeType.TOPIC)
    val topic2 = Node(NodeType.TOPIC)
    val topic3 = Node(NodeType.TOPIC)
    val topic4 = Node(NodeType.TOPIC)

    nodeRepository.saveAll(setOf(topic1, topic2, topic3, topic4))

    // Link it in the order of
    // → topic 1 → topic 2 ↓
    // ↑ topic 4 ← topic 3 ←

    nodeConnectionRepository.saveAll(
        setOf(
            NodeConnection.create(topic1, topic2, core),
            NodeConnection.create(topic2, topic3, core),
            NodeConnection.create(topic3, topic4, core),
            NodeConnection.create(topic4, topic1, core),
        ))

    assertThrows<IllegalStateException> { service.getRecursiveNodes(topic1) }
    assertThrows<IllegalStateException> { service.getRecursiveNodes(topic2) }
    assertThrows<IllegalStateException> { service.getRecursiveNodes(topic3) }
    assertThrows<IllegalStateException> { service.getRecursiveNodes(topic4) }
  }
}
