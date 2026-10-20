/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.domain.Builder
import no.ndla.taxonomy.domain.Grade
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.integration.DraftApiClient
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.service.exceptions.DuplicateConnectionException
import no.ndla.taxonomy.service.exceptions.InvalidArgumentServiceException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assertions.fail
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers
import org.mockito.Mockito.atLeastOnce
import org.mockito.Mockito.clearInvocations
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.reset
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class NodeConnectionServiceTest : AbstractIntegrationTest() {
  @Autowired private lateinit var nodeConnectionRepository: NodeConnectionRepository

  @Autowired private lateinit var nodeRepository: NodeRepository

  private lateinit var contextUpdaterService: ContextUpdaterService

  private lateinit var service: NodeConnectionService

  @Autowired private lateinit var qualityEvaluationService: QualityEvaluationService

  @Autowired private lateinit var builder: Builder

  private lateinit var draftApiClientMock: DraftApiClient

  @BeforeEach
  fun setUp() {
    contextUpdaterService = mock(ContextUpdaterService::class.java)
    draftApiClientMock = mock(DraftApiClient::class.java)

    service =
        NodeConnectionService(
            nodeConnectionRepository,
            contextUpdaterService,
            nodeRepository,
            qualityEvaluationService,
            draftApiClientMock,
        )
  }

  @Test
  fun connectTopicSubtopic() {
    val topic1 = builder.node(NodeType.TOPIC)
    val topic2 = builder.node(NodeType.TOPIC)
    val topic4 = builder.node(NodeType.TOPIC)
    val topic5 = builder.node(NodeType.TOPIC)
    val topic6 = builder.node(NodeType.TOPIC)
    val topic7 = builder.node(NodeType.TOPIC)
    val topic8 = builder.node(NodeType.TOPIC)
    val topic9 = builder.node(NodeType.TOPIC)

    val relevance = Relevance.CORE

    val connection1 = service.connectParentChild(topic2, topic1, relevance, 1)
    assertNotNull(connection1)
    assertNotNull(connection1.id)
    assertEquals(1, connection1.rank)
    assertSame(topic2, connection1.parent)
    assertSame(topic1, connection1.child)

    verify(contextUpdaterService, atLeastOnce()).updateContexts(topic1)

    // Test ranking
    val connection4 = service.connectParentChild(topic4, topic5, relevance, null)
    assertEquals(1, connection4.rank)

    val connection5 = service.connectParentChild(topic4, topic6, relevance, null)
    assertEquals(1, connection4.rank)
    assertEquals(2, connection5.rank)

    val connection6 = service.connectParentChild(topic4, topic7, relevance, 1)
    assertEquals(2, connection4.rank)
    assertEquals(3, connection5.rank)
    assertEquals(1, connection6.rank)

    val connection7 = service.connectParentChild(topic4, topic8, relevance, 3)
    assertEquals(2, connection4.rank)
    assertEquals(4, connection5.rank)
    assertEquals(1, connection6.rank)
    assertEquals(3, connection7.rank)

    val connection8 = service.connectParentChild(topic4, topic9, relevance, 5)
    assertEquals(2, connection4.rank)
    assertEquals(4, connection5.rank)
    assertEquals(1, connection6.rank)
    assertEquals(3, connection7.rank)
    assertEquals(5, connection8.rank)

    try {
      service.connectParentChild(topic4, topic8, relevance, 0)
    } catch (_: DuplicateConnectionException) {}

    // try to create loops
    val topic10 = builder.node(NodeType.TOPIC)
    val topic11 = builder.node(NodeType.TOPIC)
    val topic12 = builder.node(NodeType.TOPIC)

    try {
      service.connectParentChild(topic10, topic10, relevance, 0)
      fail("Expected InvalidArgumentServiceException")
    } catch (_: InvalidArgumentServiceException) {}

    service.connectParentChild(topic10, topic11, relevance, 0)
    service.connectParentChild(topic11, topic12, relevance, 0)

    try {
      service.connectParentChild(topic12, topic10, relevance, 0)
      fail("Expected InvalidArgumentServiceException")
    } catch (_: InvalidArgumentServiceException) {}

    try {
      service.connectParentChild(topic11, topic10, relevance, 0)
      fail("Expected InvalidArgumentServiceException")
    } catch (_: InvalidArgumentServiceException) {}

    try {
      service.connectParentChild(topic12, topic11, relevance, 0)
      fail("Expected DuplicateConnectionException")
    } catch (_: DuplicateConnectionException) {}

    try {
      service.connectParentChild(topic11, topic10, relevance, 0)
      fail("Expected InvalidArgumentServiceException")
    } catch (_: InvalidArgumentServiceException) {}
  }

  @Test
  fun connectTopicResource() {
    val topic1 = builder.node(NodeType.TOPIC)
    val topic2 = builder.node(NodeType.TOPIC)
    val topic3 = builder.node(NodeType.TOPIC)
    val topic4 = builder.node(NodeType.TOPIC)

    val resource1 = builder.node(NodeType.RESOURCE)
    val resource2 = builder.node(NodeType.RESOURCE)
    val resource3 = builder.node(NodeType.RESOURCE)
    val resource4 = builder.node(NodeType.RESOURCE)
    val resource5 = builder.node(NodeType.RESOURCE)
    val resource6 = builder.node(NodeType.RESOURCE)
    val resource7 = builder.node(NodeType.RESOURCE)

    val relevance = Relevance.CORE

    val connection1 =
        service.connectParentChild(
            topic1, resource1, relevance, null, true, NodeConnectionType.BRANCH)
    assertNotNull(connection1)
    assertSame(topic1, connection1.parent)
    assertSame(resource1, connection1.resource)
    assertTrue(connection1.isPrimary)
    assertEquals(1, connection1.rank)

    verify(contextUpdaterService, atLeastOnce()).updateContexts(resource1)

    val connection2 =
        service.connectParentChild(
            topic1, resource2, relevance, null, true, NodeConnectionType.BRANCH)
    assertNotNull(connection2)
    assertSame(topic1, connection2.parent)
    assertSame(resource2, connection2.resource)
    assertTrue(connection2.isPrimary)
    assertEquals(2, connection2.rank)

    assertTrue(connection1.isPrimary)
    assertEquals(1, connection1.rank)

    val connection3 =
        service.connectParentChild(
            topic2, resource2, relevance, null, false, NodeConnectionType.BRANCH)
    assertFalse(connection3.isPrimary)
    assertEquals(1, connection3.rank)

    // Has not changed the first connection since setting this to non-primary
    assertTrue(connection2.isPrimary)

    // Test setting primary, should set old primary to non-primary
    val connection4 =
        service.connectParentChild(
            topic3, resource2, relevance, null, true, NodeConnectionType.BRANCH)
    assertTrue(connection4.isPrimary)
    assertEquals(1, connection4.rank)

    assertFalse(connection3.isPrimary)
    assertFalse(connection2.isPrimary)

    // Test ranking
    val connection5 =
        service.connectParentChild(
            topic4, resource1, relevance, null, true, NodeConnectionType.BRANCH)
    assertEquals(1, connection5.rank)

    val connection6 =
        service.connectParentChild(
            topic4, resource2, relevance, null, true, NodeConnectionType.BRANCH)
    assertEquals(1, connection5.rank)
    assertEquals(2, connection6.rank)

    val connection7 =
        service.connectParentChild(topic4, resource3, relevance, 1, true, NodeConnectionType.BRANCH)
    assertEquals(2, connection5.rank)
    assertEquals(3, connection6.rank)
    assertEquals(1, connection7.rank)

    val connection8 =
        service.connectParentChild(topic4, resource4, relevance, 2, true, NodeConnectionType.BRANCH)
    assertEquals(3, connection5.rank)
    assertEquals(4, connection6.rank)
    assertEquals(1, connection7.rank)
    assertEquals(2, connection8.rank)

    val connection9 =
        service.connectParentChild(topic4, resource5, relevance, 5, true, NodeConnectionType.BRANCH)
    assertEquals(3, connection5.rank)
    assertEquals(4, connection6.rank)
    assertEquals(1, connection7.rank)
    assertEquals(2, connection8.rank)
    assertEquals(5, connection9.rank)

    // First topic connection for a resource will be primary regardless of request
    val forcedPrimaryConnection1 =
        service.connectParentChild(
            topic4, resource6, relevance, 0, false, NodeConnectionType.BRANCH)
    assertTrue(forcedPrimaryConnection1.isPrimary)
    val forcedPrimaryConnection2 =
        service.connectParentChild(
            topic4, resource7, relevance, 1, false, NodeConnectionType.BRANCH)
    assertTrue(forcedPrimaryConnection2.isPrimary)

    // Trying to add duplicate connection
    try {
      service.connectParentChild(topic4, resource4, relevance, 0, false, NodeConnectionType.BRANCH)
      fail("Expected DuplicateConnectionException")
    } catch (_: DuplicateConnectionException) {}
  }

  @Test
  fun connectLearningpathDoesNotUpdateDraftNotes() {
    val topic = builder.node(NodeType.TOPIC)
    val learningpath =
        builder.node(NodeType.RESOURCE) { node ->
          node.contentUri(URI.create("urn:learningpath:1"))
        }

    clearInvocations(draftApiClientMock)

    val connection =
        service.connectParentChild(
            topic, learningpath, Relevance.CORE, null, true, NodeConnectionType.BRANCH)

    assertNotNull(connection)
    verifyNoInteractions(draftApiClientMock)
  }

  @Test
  fun disconnectTopicSubtopic() {
    val topic1 = builder.node(NodeType.TOPIC)
    val subtopic1 = builder.node(NodeType.TOPIC)
    val subtopic2 = builder.node(NodeType.TOPIC)
    val subtopic3 = builder.node(NodeType.TOPIC)
    val relevance = Relevance.CORE

    val topic1subtopic1 = NodeConnection.create(topic1, subtopic1, relevance)
    val topic1subtopic2 = NodeConnection.create(topic1, subtopic2, relevance)
    val topic1subtopic3 = NodeConnection.create(topic1, subtopic3, relevance)

    // Just verifies the pre-conditions of the created objects that is used for the test
    assertTrue(
        topic1
            .getChildConnections()
            .containsAll(setOf(topic1subtopic1, topic1subtopic2, topic1subtopic3)))
    assertSame(topic1subtopic1, subtopic1.getParentConnections().first())
    assertSame(topic1subtopic2, subtopic2.getParentConnections().first())
    assertSame(topic1subtopic3, subtopic3.getParentConnections().first())
    assertEquals(3, topic1.getChildConnections().size)

    reset(contextUpdaterService)

    service.disconnectParentChildConnection(topic1subtopic1)

    verify(contextUpdaterService).updateContexts(subtopic1)

    assertNull(topic1subtopic1.parent)
    assertNull(topic1subtopic1.child)
    assertFalse(topic1.getChildConnections().contains(topic1subtopic1))
    assertEquals(2, topic1.getChildConnections().size)
    assertFalse(subtopic1.getParentConnections().isNotEmpty())
    assertSame(topic1subtopic2, subtopic2.getParentConnections().first())
    assertSame(topic1subtopic3, subtopic3.getParentConnections().first())

    service.disconnectParentChild(topic1, subtopic2)
    assertNull(topic1subtopic2.parent)
    assertNull(topic1subtopic2.child)
    assertFalse(topic1.getChildConnections().contains(topic1subtopic2))
    assertEquals(1, topic1.getChildConnections().size)
    assertFalse(subtopic1.getParentConnections().isNotEmpty())
    assertFalse(subtopic2.getParentConnections().isNotEmpty())
    assertSame(topic1subtopic3, subtopic3.getParentConnections().first())
  }

  @Test
  fun disconnectTopicResource() {
    val topic1 = builder.node(NodeType.TOPIC)
    val topic2 = builder.node(NodeType.TOPIC)
    val topic3 = builder.node(NodeType.TOPIC)

    val resource1 = builder.node(NodeType.RESOURCE)
    val resource2 = builder.node(NodeType.RESOURCE)
    val resource3 = builder.node(NodeType.RESOURCE)

    val relevance = Relevance.CORE

    val topic1resource1 =
        NodeConnection.create(
            topic1, resource1, relevance, NodeConnectionType.BRANCH, isPrimary = true)
    val topic1resource2 =
        NodeConnection.create(
            topic1, resource2, relevance, NodeConnectionType.BRANCH, isPrimary = true)
    val topic1resource3 =
        NodeConnection.create(
            topic1, resource3, relevance, NodeConnectionType.BRANCH, isPrimary = true)

    val topic2resource1 =
        NodeConnection.create(
            topic2, resource1, relevance, NodeConnectionType.BRANCH, isPrimary = false)
    val topic3resource1 =
        NodeConnection.create(
            topic3, resource1, relevance, NodeConnectionType.BRANCH, isPrimary = false)

    assertTrue(topic1resource1.isPrimary)
    assertTrue(topic1resource2.isPrimary)
    assertTrue(topic1resource3.isPrimary)
    assertFalse(topic2resource1.isPrimary)
    assertFalse(topic3resource1.isPrimary)

    assertTrue(topic1.resourceChildren.contains(topic1resource1))
    assertTrue(resource1.getParentConnections().contains(topic1resource1))

    reset(contextUpdaterService)

    service.disconnectParentChild(topic1, resource1)

    verify(contextUpdaterService, atLeastOnce()).updateContexts(resource1)

    assertTrue(topic2resource1.isPrimary xor topic3resource1.isPrimary)
    assertNull(topic1resource1.resource)
    assertNull(topic1resource1.parent)
    assertFalse(topic1.resourceChildren.contains(topic1resource1))
    assertFalse(resource1.getParentConnections().contains(topic1resource1))

    service.disconnectParentChildConnection(topic2resource1)
    assertTrue(topic3resource1.isPrimary)

    assertTrue(resource2.getParentConnections().contains(topic1resource2))
    assertTrue(resource3.getParentConnections().contains(topic1resource3))

    service.disconnectParentChildConnection(topic1resource2)
    service.disconnectParentChildConnection(topic1resource3)

    assertFalse(resource2.getParentConnections().contains(topic1resource2))
    assertFalse(resource3.getParentConnections().contains(topic1resource3))
  }

  @Test
  fun disconnectLearningpathDoesNotUpdateDraftNotes() {
    val topic = builder.node(NodeType.TOPIC)
    val learningpath =
        builder.node(NodeType.RESOURCE) { node ->
          node.contentUri(URI.create("urn:learningpath:2"))
        }

    val connection =
        NodeConnection.create(
            topic, learningpath, Relevance.CORE, NodeConnectionType.BRANCH, isPrimary = true)

    clearInvocations(draftApiClientMock)

    service.disconnectParentChildConnection(connection)

    verifyNoInteractions(draftApiClientMock)
  }

  @Test
  fun updateTopicSubtopic() {
    val rootTopic1 = builder.node(NodeType.TOPIC)

    val subTopic1 = builder.node(NodeType.TOPIC)

    val relevance = Relevance.CORE

    val connection1 = NodeConnection.create(rootTopic1, subTopic1, relevance)

    connection1.rank = 1

    assertEquals(1, connection1.rank)

    service.updateParentChild(connection1, relevance, 2, null)
    assertEquals(2, connection1.rank)
  }

  @Test
  fun updateTopicResource() {
    val topic1 = builder.node(NodeType.TOPIC)
    val topic2 = builder.node(NodeType.TOPIC)

    val resource1 = builder.node(NodeType.RESOURCE)
    val resource2 = builder.node(NodeType.RESOURCE)
    val resource3 = builder.node(NodeType.RESOURCE)

    val relevance = Relevance.CORE

    val topic1resource1 =
        NodeConnection.create(
            topic1, resource1, relevance, NodeConnectionType.BRANCH, isPrimary = true)
    val topic1resource2 =
        NodeConnection.create(
            topic1, resource2, relevance, NodeConnectionType.BRANCH, isPrimary = true)
    val topic1resource3 =
        NodeConnection.create(
            topic1, resource3, relevance, NodeConnectionType.BRANCH, isPrimary = true)

    val topic2resource1 =
        NodeConnection.create(
            topic2, resource1, relevance, NodeConnectionType.BRANCH, isPrimary = false)

    topic1resource1.rank = 1
    topic1resource2.rank = 2
    topic1resource3.rank = 3

    assertTrue(topic1resource1.isPrimary)
    assertTrue(topic1resource2.isPrimary)
    assertTrue(topic1resource3.isPrimary)
    assertFalse(topic2resource1.isPrimary)

    service.updateParentChild(topic2resource1, relevance, null, true)

    assertFalse(topic1resource1.isPrimary)
    assertTrue(topic1resource2.isPrimary)
    assertTrue(topic1resource3.isPrimary)
    assertTrue(topic2resource1.isPrimary)

    service.updateParentChild(topic2resource1, relevance, null, false)

    assertTrue(topic1resource1.isPrimary)
    assertTrue(topic1resource2.isPrimary)
    assertTrue(topic1resource3.isPrimary)
    assertFalse(topic2resource1.isPrimary)

    try {
      service.updateParentChild(topic1resource3, relevance, null, false)
      fail("Expected InvalidArgumentServiceException")
    } catch (_: InvalidArgumentServiceException) {}

    assertEquals(1, topic1resource1.rank)
    assertEquals(2, topic1resource2.rank)
    assertEquals(3, topic1resource3.rank)
    service.updateParentChild(topic1resource3, relevance, 1, true)
    assertEquals(2, topic1resource1.rank)
    assertEquals(3, topic1resource2.rank)
    assertEquals(1, topic1resource3.rank)

    service.updateParentChild(topic1resource2, relevance, 2, true)
    assertEquals(3, topic1resource1.rank)
    assertEquals(2, topic1resource2.rank)
    assertEquals(1, topic1resource3.rank)
  }

  @Test
  fun updateLearningpathPrimaryDoesNotUpdateDraftPrimaryNotes() {
    val topic1 = builder.node(NodeType.TOPIC)
    val topic2 = builder.node(NodeType.TOPIC)

    val learningpath =
        builder.node(NodeType.RESOURCE) { node ->
          node.contentUri(URI.create("urn:learningpath:1"))
        }

    val relevance = Relevance.CORE

    val topic1learningpath =
        NodeConnection.create(
            topic1, learningpath, relevance, NodeConnectionType.BRANCH, isPrimary = true)
    val topic2learningpath =
        NodeConnection.create(
            topic2, learningpath, relevance, NodeConnectionType.BRANCH, isPrimary = false)

    clearInvocations(draftApiClientMock)

    service.updateParentChild(topic2learningpath, relevance, null, true)

    assertFalse(topic1learningpath.isPrimary)
    assertTrue(topic2learningpath.isPrimary)
    verify(draftApiClientMock, never())
        .updatePrimaryNotesWithUpdatedConnection(
            anyNonNull(NodeConnection::class.java), ArgumentMatchers.any())
  }

  @Test
  fun updateLearningpathRelevanceDoesNotUpdateDraftNotes() {
    val topic = builder.node(NodeType.TOPIC)
    val learningpath =
        builder.node(NodeType.RESOURCE) { node ->
          node.contentUri(URI.create("urn:learningpath:3"))
        }

    val connection =
        NodeConnection.create(
            topic, learningpath, Relevance.CORE, NodeConnectionType.BRANCH, isPrimary = true)

    clearInvocations(draftApiClientMock)

    service.updateParentChild(connection, Relevance.SUPPLEMENTARY, null, null)

    assertEquals(Relevance.SUPPLEMENTARY, connection.relevance)
    verifyNoInteractions(draftApiClientMock)
  }

  @Test
  fun replacePrimaryConnectionsFor() {
    val subject1 = builder.node(NodeType.SUBJECT)

    val topic1 = builder.node(NodeType.TOPIC)
    val topic2 = builder.node(NodeType.TOPIC)

    val resource1 = builder.node(NodeType.RESOURCE)

    val relevance = Relevance.CORE

    NodeConnection.create(subject1, topic1, relevance)

    val topic1resource1 =
        NodeConnection.create(
            topic1, resource1, relevance, NodeConnectionType.BRANCH, isPrimary = true)
    val topic2resource1 =
        NodeConnection.create(
            topic2, resource1, relevance, NodeConnectionType.BRANCH, isPrimary = false)

    assertTrue(topic1resource1.isPrimary)
    assertFalse(topic2resource1.isPrimary)

    service.replacePrimaryConnectionsFor(topic1)

    assertFalse(topic1resource1.isPrimary)
    assertTrue(topic2resource1.isPrimary)
  }

  @Test
  fun add_both_child_and_link_to_same_topic() {
    val subject = builder.node(NodeType.SUBJECT)
    val topic = builder.node(NodeType.TOPIC)
    run {
      val c1 =
          service.connectParentChild(
              subject, topic, Relevance.CORE, 1, true, NodeConnectionType.BRANCH)
      assertTrue(c1.isPrimary)
      val c2 =
          service.connectParentChild(
              subject, topic, Relevance.CORE, 2, true, NodeConnectionType.LINK)
      assertTrue(c2.isPrimary)
    }
    val subject2 = builder.node(NodeType.SUBJECT)
    run {
      // Two connections to the same topic with same type should fail
      try {
        service.connectParentChild(
            subject2, topic, Relevance.CORE, 2, true, NodeConnectionType.BRANCH)
        fail("Expected DuplicateConnectionException")
      } catch (_: DuplicateConnectionException) {}
      val c1 =
          service.connectParentChild(
              subject2, topic, Relevance.CORE, 1, true, NodeConnectionType.LINK)
      assertTrue(c1.isPrimary)
    }
    val subject3 = builder.node(NodeType.SUBJECT)
    run {
      // A topic can have more than one link connection
      val c1 =
          service.connectParentChild(
              subject3, topic, Relevance.CORE, 1, true, NodeConnectionType.LINK)
      assertTrue(c1.isPrimary)
    }
  }

  @Test
  fun link_connections_do_not_affect_quality_evaluation() {
    val topic = builder.node(NodeType.TOPIC)
    val branchResource =
        builder.node(NodeType.RESOURCE) { resource -> resource.qualityEvaluation(Grade.Five) }
    val linkedResource =
        builder.node(NodeType.RESOURCE) { resource -> resource.qualityEvaluation(Grade.One) }

    service.connectParentChild(
        topic, branchResource, Relevance.CORE, 1, true, NodeConnectionType.BRANCH)

    assertNotNull(topic.childQualityEvaluationAverage)
    assertEquals(1, topic.childQualityEvaluationAverage!!.count)
    assertEquals(5.0, topic.childQualityEvaluationAverage!!.averageValue)

    val linkConnection =
        service.connectParentChild(
            topic, linkedResource, Relevance.CORE, 2, false, NodeConnectionType.LINK)

    assertNotNull(topic.childQualityEvaluationAverage)
    assertEquals(1, topic.childQualityEvaluationAverage!!.count)
    assertEquals(5.0, topic.childQualityEvaluationAverage!!.averageValue)

    service.disconnectParentChildConnection(linkConnection)

    assertNotNull(topic.childQualityEvaluationAverage)
    assertEquals(1, topic.childQualityEvaluationAverage!!.count)
    assertEquals(5.0, topic.childQualityEvaluationAverage!!.averageValue)
  }

  private fun <T> anyNonNull(type: Class<T>): T = ArgumentMatchers.any(type)
}
