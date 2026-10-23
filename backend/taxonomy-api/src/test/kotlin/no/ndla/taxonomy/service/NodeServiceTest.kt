/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.Builder
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.repositories.NodeRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.fail
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class NodeServiceTest : AbstractIntegrationTest() {
  @Autowired private lateinit var nodeRepository: NodeRepository

  @Autowired private lateinit var builder: Builder

  @MockitoBean private lateinit var nodeConnectionService: NodeConnectionService

  @Autowired private lateinit var nodeService: NodeService

  @Autowired private lateinit var searchService: SearchService

  @BeforeEach
  fun clearAllRepos() {
    nodeRepository.deleteAllAndFlush()
  }

  @Test
  fun delete() {
    val createdTopic = builder.node { n -> n.nodeType(NodeType.TOPIC) }
    val topicId = createdTopic.publicId
    nodeService.delete(topicId)

    assertNull(nodeRepository.findFirstByPublicId(topicId))
    verify(nodeConnectionService).disconnectAllParents(createdTopic)
    verify(nodeConnectionService).disconnectAllChildren(createdTopic)
  }

  @Test
  fun getAllConnections() {
    val topicId = builder.node { n -> n.nodeType(NodeType.TOPIC) }.publicId

    val subjectTopic = mock(NodeConnection::class.java)
    val parentTopicSubtopic = mock(NodeConnection::class.java)
    val childTopicSubtopic = mock(NodeConnection::class.java)

    `when`(subjectTopic.publicId).thenReturn(URI.create("urn:subject-topic"))
    `when`(subjectTopic.connectionType).thenReturn(NodeConnectionType.BRANCH)
    `when`(parentTopicSubtopic.publicId).thenReturn(URI.create("urn:parent-topic"))
    `when`(parentTopicSubtopic.connectionType).thenReturn(NodeConnectionType.BRANCH)
    `when`(childTopicSubtopic.publicId).thenReturn(URI.create("urn:child-topic"))
    `when`(childTopicSubtopic.connectionType).thenReturn(NodeConnectionType.BRANCH)

    val parentConnectionsToReturn = setOf(subjectTopic)
    val childConnectionsToReturn = setOf(childTopicSubtopic)

    `when`(nodeConnectionService.getParentConnections(any(Node::class.java) ?: Node()))
        .thenAnswer { invocationOnMock ->
          val topic = invocationOnMock.getArgument<Node>(0)
          assertEquals(topicId, topic.publicId)

          parentConnectionsToReturn
        }
    `when`(nodeConnectionService.getChildConnections(any(Node::class.java) ?: Node())).thenAnswer {
        invocationOnMock ->
      val topic = invocationOnMock.getArgument<Node>(0)
      assertEquals(topicId, topic.publicId)

      childConnectionsToReturn
    }

    val returnedConnections = nodeService.getAllConnections(topicId)

    assertEquals(2, returnedConnections.size)
    returnedConnections.forEach { connection ->
      if (connection.connectionId == URI.create("urn:subject-topic")) {
        assertEquals("parent", connection.type)
      } else if (connection.connectionId == URI.create("urn:child-topic")) {
        assertEquals("child", connection.type)
      } else {
        fail<Unit>()
      }
    }
  }

  @Test
  fun allSearch() {
    builder.node { n -> n.nodeType(NodeType.TOPIC) }
    builder.node { n -> n.nodeType(NodeType.TOPIC) }
    builder.node { n -> n.nodeType(NodeType.TOPIC) }
    builder.node { n -> n.nodeType(NodeType.TOPIC) }
    val subject = builder.node { n -> n.nodeType(NodeType.SUBJECT) }

    val subjects =
        searchService.search(
            language = "",
            includeContexts = true,
            filterProgrammes = false,
            pageSize = 10,
            page = 1,
            nodeType = listOf(NodeType.SUBJECT),
        )

    val topics =
        searchService.search(
            language = "",
            includeContexts = true,
            filterProgrammes = false,
            pageSize = 10,
            page = 1,
            nodeType = listOf(NodeType.TOPIC),
        )
    val all =
        searchService.search(
            language = "",
            includeContexts = true,
            filterProgrammes = false,
            pageSize = 10,
            page = 1,
        )

    assertEquals(subjects.results.first().id, subject.publicId)

    assertEquals(1L, subjects.totalCount)
    assertEquals(4L, topics.totalCount)
    assertEquals(5L, all.totalCount)
  }

  @Test
  fun querySearchWorks() {
    builder.node { n -> n.nodeType(NodeType.TOPIC).name("Apekatt") }
    builder.node { n -> n.nodeType(NodeType.TOPIC).name("Katt") }
    builder.node { n -> n.nodeType(NodeType.TOPIC).name("Hund") }
    val tiger = builder.node { n -> n.nodeType(NodeType.TOPIC).name("Tiger") }

    val result =
        searchService.search(
            query = "tiger",
            language = "",
            includeContexts = true,
            filterProgrammes = false,
            pageSize = 10,
            page = 1,
        )

    assertEquals(result.results.first().id, tiger.publicId)
    assertEquals(1L, result.totalCount)
  }

  @Test
  fun idsAndQuerySearch() {
    builder.node { n -> n.nodeType(NodeType.TOPIC).name("Apekatt").publicId("urn:topic:1") }
    builder.node { n -> n.nodeType(NodeType.TOPIC).name("Katt").publicId("urn:topic:2") }
    builder.node { n -> n.nodeType(NodeType.TOPIC).name("Hund").publicId("urn:topic:3") }
    builder.node { n -> n.nodeType(NodeType.TOPIC).name("Tiger").publicId("urn:topic:4") }

    val idList = listOf("urn:topic:1", "urn:topic:2")

    val result =
        searchService.search(
            ids = idList,
            language = "",
            includeContexts = true,
            filterProgrammes = false,
            pageSize = 10,
            page = 1,
        )

    assertEquals(URI("urn:topic:1"), result.results[0].id)
    assertEquals(URI("urn:topic:2"), result.results[1].id)
    assertEquals(2L, result.totalCount)

    val result2 =
        searchService.search(
            query = "Ape",
            ids = idList,
            language = "",
            includeContexts = true,
            filterProgrammes = false,
            pageSize = 10,
            page = 1,
        )

    assertEquals(URI("urn:topic:1"), result2.results.first().id)
    assertEquals(1L, result2.totalCount)
  }

  @Test
  fun contentUriSearch() {
    builder.node { n ->
      n.nodeType(NodeType.TOPIC).name("Apekatt").publicId("urn:topic:1").contentUri("urn:article:1")
    }
    builder.node { n ->
      n.nodeType(NodeType.TOPIC).name("Katt").publicId("urn:topic:2").contentUri("urn:article:2")
    }
    builder.node { n ->
      n.nodeType(NodeType.TOPIC).name("Hund").publicId("urn:topic:3").contentUri("urn:article:3")
    }
    builder.node { n ->
      n.nodeType(NodeType.TOPIC).name("Tiger").publicId("urn:topic:4").contentUri("urn:article:1")
    }

    val idList = listOf("urn:article:1")

    val result =
        searchService.search(
            contentUris = idList,
            language = "",
            includeContexts = true,
            filterProgrammes = false,
            pageSize = 10,
            page = 1,
        )

    TestUtils.assertAnyTrue(result.results) { it.id == URI.create("urn:topic:1") }
    TestUtils.assertAnyTrue(result.results) { it.id == URI.create("urn:topic:4") }
    assertEquals(2L, result.totalCount)
  }
}
