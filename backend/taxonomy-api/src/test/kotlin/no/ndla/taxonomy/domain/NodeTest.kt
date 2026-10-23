/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import jakarta.transaction.Transactional
import java.net.URI
import java.net.URISyntaxException
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.service.AbstractIntegrationTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertNotNull
import org.junit.jupiter.api.assertNull
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito.mock
import org.mockito.Mockito.spy
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.test.util.ReflectionTestUtils

@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class NodeTest : AbstractIntegrationTest() {
  @Autowired private lateinit var nodeRepository: NodeRepository

  @Autowired private lateinit var builder: Builder

  private lateinit var node: Node

  @BeforeEach
  fun setUp() {
    nodeRepository.deleteAllAndFlush()
    node = Node(NodeType.NODE)
  }

  @Test
  fun name() {
    assertEquals(node, node.name("test name 1"))
    assertEquals("test name 1", node.name)
  }

  @Test
  fun getAddAndRemoveSubjectTopics() {
    val node = spy(this.node)

    assertEquals(0, node.getParentConnections().size)

    val connection1 = mock(NodeConnection::class.java)
    val connection2 = mock(NodeConnection::class.java)

    assertThrows<IllegalArgumentException> { node.addParentConnection(connection1) }

    `when`(connection1.child).thenReturn(node)
    node.addParentConnection(connection1)

    `when`(connection1.parent).thenReturn(node)

    assertEquals(1, node.getParentConnections().size)
    assertTrue(node.getParentConnections().contains(connection1))

    assertThrows<IllegalArgumentException> { node.addParentConnection(connection2) }

    `when`(connection2.child).thenReturn(node)
    node.addParentConnection(connection2)

    `when`(connection2.parent).thenReturn(node)

    assertEquals(2, node.getParentConnections().size)
    assertTrue(node.getParentConnections().containsAll(setOf(connection1, connection2)))

    node.removeParentConnection(connection1)
    assertEquals(1, node.getParentConnections().size)
    assertTrue(node.getParentConnections().contains(connection2))
    verify(connection1).disassociate()

    node.removeParentConnection(connection2)
    assertEquals(0, node.getParentConnections().size)
    verify(connection2).disassociate()
  }

  @Test
  fun addGetAndRemoveChildrenTopicSubtopics() {
    assertEquals(0, node.getChildConnections().size)

    val connection1 = mock(NodeConnection::class.java)
    val connection2 = mock(NodeConnection::class.java)

    assertThrows<IllegalArgumentException> { node.addChildConnection(connection1) }
    `when`(connection1.parent).thenReturn(node)
    node.addChildConnection(connection1)

    assertEquals(1, node.getChildConnections().size)
    assertTrue(node.getChildConnections().contains(connection1))

    try {
      node.addChildConnection(connection2)
    } catch (ignored: IllegalArgumentException) {}
    `when`(connection2.parent).thenReturn(node)
    node.addChildConnection(connection2)

    assertEquals(2, node.getChildConnections().size)
    assertTrue(node.getChildConnections().containsAll(setOf(connection1, connection2)))

    node.removeChildConnection(connection1)
    verify(connection1).disassociate()
    assertEquals(1, node.getChildConnections().size)
    assertTrue(node.getChildConnections().contains(connection2))

    node.removeChildConnection(connection2)
    verify(connection2).disassociate()
    assertEquals(0, node.getChildConnections().size)
  }

  @Test
  fun addGetAndRemoveParentTopicSubtopics() {
    assertTrue(node.parentNodes.isEmpty())

    val connection1 = mock(NodeConnection::class.java)
    val connection2 = mock(NodeConnection::class.java)

    assertThrows<IllegalArgumentException> { node.addParentConnection(connection1) }
    `when`(connection1.child).thenReturn(node)
    node.addParentConnection(connection1)

    assertFalse(node.getParentConnections().isEmpty())
    assertSame(connection1, node.getParentConnections().first())

    assertThrows<IllegalArgumentException> { node.addParentConnection(connection2) }

    node.removeParentConnection(connection1)
    verify(connection1).disassociate()
    assertTrue(node.getParentConnections().isEmpty())
  }

  @Test
  fun addGetAndRemoveNodeResources() {
    assertEquals(0, node.resourceChildren.size)

    val nodeResource1 = mock(NodeConnection::class.java)
    val nodeResource2 = mock(NodeConnection::class.java)
    val resource1 = mock(Node::class.java)
    val resource2 = mock(Node::class.java)
    `when`(resource1.nodeType).thenReturn(NodeType.RESOURCE)
    `when`(resource2.nodeType).thenReturn(NodeType.RESOURCE)
    `when`(nodeResource1.child).thenReturn(resource1)
    `when`(nodeResource2.child).thenReturn(resource2)

    assertThrows<IllegalArgumentException> { node.addChildConnection(nodeResource1) }

    `when`(nodeResource1.parent).thenReturn(node)
    node.addChildConnection(nodeResource1)

    assertEquals(1, node.resourceChildren.size)
    assertTrue(node.resourceChildren.contains(nodeResource1))

    assertThrows<IllegalArgumentException> { node.addChildConnection(nodeResource2) }
    `when`(nodeResource2.parent).thenReturn(node)
    node.addChildConnection(nodeResource2)

    assertEquals(2, node.resourceChildren.size)
    assertTrue(node.resourceChildren.containsAll(setOf(nodeResource1, nodeResource2)))

    node.removeChildConnection(nodeResource1)
    verify(nodeResource1).disassociate()
    assertEquals(1, node.resourceChildren.size)
    assertTrue(node.resourceChildren.contains(nodeResource2))

    node.removeChildConnection(nodeResource2)
    verify(nodeResource2).disassociate()
    assertEquals(0, node.resourceChildren.size)
  }

  @Test
  fun getParent() {
    val parent1 = mock(Node::class.java)

    val nodeConnection = mock(NodeConnection::class.java)

    `when`(nodeConnection.child).thenReturn(node)
    `when`(nodeConnection.parent).thenReturn(parent1)

    assertTrue(node.parentNodes.isEmpty())

    node.addParentConnection(nodeConnection)

    assertFalse(node.parentNodes.isEmpty())
    assertSame(parent1, node.parentNodes.first())
  }

  @Test
  fun getResources() {
    val resource1 = mock(Node::class.java)
    val resource2 = mock(Node::class.java)

    val nodeResource1 = mock(NodeConnection::class.java)
    val nodeResource2 = mock(NodeConnection::class.java)
    val NodeResource3 = mock(NodeConnection::class.java)

    setOf(nodeResource1, nodeResource2, NodeResource3).forEach { nodeResource ->
      `when`(nodeResource.parent).thenReturn(node)
    }
    `when`(resource1.nodeType).thenReturn(NodeType.RESOURCE)
    `when`(resource2.nodeType).thenReturn(NodeType.RESOURCE)
    `when`(nodeResource1.resource).thenReturn(resource1)
    `when`(nodeResource2.resource).thenReturn(resource2)
    `when`(nodeResource1.child).thenReturn(resource1)
    `when`(nodeResource2.child).thenReturn(resource2)

    node.addChildConnection(nodeResource1)
    node.addChildConnection(nodeResource2)
    node.addChildConnection(NodeResource3)

    assertEquals(2, node.resourceChildren.size)
    assertEquals(3, node.getChildConnections().size)
    assertEquals(2, node.resources.size)
    assertTrue(node.resources.containsAll(setOf(resource1, resource2)))
  }

  @Test
  @Throws(URISyntaxException::class)
  fun setAndGetContentUri() {
    assertNull(node.contentUri)
    node.contentUri = URI("urn:test1")
    assertEquals("urn:test1", node.contentUri.toString())
  }

  @Test
  fun setAndIsContext() {
    assertFalse(node.isContext)
    node.isContext = true
    assertTrue(node.isContext)
    node.isContext = false
    assertFalse(node.isContext)
  }

  @Test
  fun addAndGetAndRemoveTranslation() {
    assertEquals(0, node.translations.size)

    val returnedTranslation = node.addTranslation("hei", "nb")
    assertEquals(1, node.translations.size)
    assertEquals("nb", returnedTranslation.languageCode)
    assertTrue(node.translations.contains(returnedTranslation))
    assertEquals(node, returnedTranslation.parent)

    val returnedTranslation2 = node.addTranslation("hello", "en")
    assertEquals(2, node.translations.size)
    assertEquals("en", returnedTranslation2.languageCode)
    assertTrue(node.translations.containsAll(setOf(returnedTranslation, returnedTranslation2)))
    assertEquals(node, returnedTranslation2.parent)

    node.removeTranslation("nb")

    assertNull(returnedTranslation.parent)
    assertFalse(node.translations.contains(returnedTranslation))

    assertFalse(node.getTranslation("nb").isPresent)

    node.addTranslation(returnedTranslation)
    assertEquals(node, returnedTranslation.parent)
    assertTrue(node.translations.contains(returnedTranslation))

    assertEquals(returnedTranslation, node.getTranslation("nb").get())
    assertEquals(returnedTranslation2, node.getTranslation("en").orElse(null))
  }

  @Test
  fun preRemove() {
    val parentConnections =
        setOf(mock(NodeConnection::class.java), mock(NodeConnection::class.java))
    val childConnections = setOf(mock(NodeConnection::class.java), mock(NodeConnection::class.java))
    val topicResources = setOf(mock(NodeConnection::class.java), mock(NodeConnection::class.java))

    parentConnections.forEach { nodeConnection ->
      `when`(nodeConnection.child).thenReturn(node)
      node.addParentConnection(nodeConnection)
    }

    childConnections.forEach { nodeConnection ->
      `when`(nodeConnection.parent).thenReturn(node)
      node.addChildConnection(nodeConnection)
    }

    topicResources.forEach { nodeResource ->
      `when`(nodeResource.parent).thenReturn(node)
      node.addChildConnection(nodeResource)
    }

    node.preRemove()

    parentConnections.forEach { nodeConnection -> verify(nodeConnection).disassociate() }
    childConnections.forEach { nodeConnection -> verify(nodeConnection).disassociate() }
    topicResources.forEach { nodeResource -> verify(nodeResource).disassociate() }
  }

  @Test
  fun pickTheCorrectContext() {
    val root = Node(NodeType.NODE).name("root")
    val parent1 = Node(NodeType.NODE).name("parent1")
    val parent2 = Node(NodeType.NODE).name("parent2")
    node = node.name("name")
    val context1 =
        TaxonomyContext(
            node.publicId.toString(),
            LanguageField.fromNode(node),
            node.nodeType,
            node.publicId.toString(),
            LanguageField.fromNode(node),
            node.pathPart,
            LanguageField.listFromNode(node),
            null,
            listOf(),
            listOf(),
            true,
            true,
            true,
            false,
            "urn:relevance:core",
            "1",
            0,
            "urn:connection1",
            listOf(),
        )
    val context2 =
        TaxonomyContext(
            node.publicId.toString(),
            LanguageField.fromNode(node),
            node.nodeType,
            root.publicId.toString(),
            LanguageField.fromNode(root),
            root.pathPart + parent1.pathPart + context1.path,
            LanguageField.listFromLists(
                LanguageField.listFromLists(
                    LanguageField.listFromNode(root), LanguageField.fromNode(parent1)),
                LanguageField.fromNode(node),
            ),
            null,
            listOf(root.publicId.toString(), parent1.publicId.toString()),
            listOf(context1.contextId),
            true,
            true,
            true,
            false,
            "urn:relevance:core",
            "2",
            0,
            "urn:connection2",
            listOf(),
        )
    val context3 =
        TaxonomyContext(
            node.publicId.toString(),
            LanguageField.fromNode(node),
            node.nodeType,
            root.publicId.toString(),
            LanguageField.fromNode(root),
            root.pathPart + parent2.pathPart + context1.path,
            LanguageField.listFromLists(
                LanguageField.listFromLists(
                    LanguageField.listFromNode(root), LanguageField.fromNode(parent2)),
                LanguageField.fromNode(node),
            ),
            null,
            listOf(root.publicId.toString(), parent2.publicId.toString()),
            listOf(context1.contextId, context2.contextId),
            true,
            true,
            true,
            false,
            "urn:relevance:core",
            "3",
            0,
            "urn:connection3",
            listOf(),
        )

    node.contexts = setOf(context3, context2, context1)

    run {
      val context = node.pickContext("1", null, null, NodeConnectionType.BRANCH, setOf())
      assertEquals(context1.contextId, context?.contextId)
    }
    run {
      val context = node.pickContext("2", null, null, NodeConnectionType.BRANCH, setOf())
      assertEquals(context2.contextId, context?.contextId)
    }
    run {
      val context = node.pickContext("3", null, null, NodeConnectionType.BRANCH, setOf())
      assertEquals(context3.contextId, context?.contextId)
    }
    run {
      val context = node.pickContext(null, null, null, NodeConnectionType.BRANCH, setOf())
      assertEquals(context1.contextId, context?.contextId)
    }
    run {
      val context = node.pickContext(null, parent1, root, NodeConnectionType.BRANCH, setOf())
      assertEquals(context2.contextId, context?.contextId)
    }
    run {
      val context = node.pickContext(null, parent2, root, NodeConnectionType.BRANCH, setOf())
      assertEquals(context3.contextId, context?.contextId)
    }
    run {
      val context = node.pickContext(null, null, root, NodeConnectionType.BRANCH, setOf())
      // could be either 2 or 3, either way root is root
      assertEquals(root.publicId.toString(), context?.rootId)
    }
    run {
      val context = node.pickContext(null, null, null, NodeConnectionType.BRANCH, setOf())
      assertEquals(context1.contextId, context?.contextId) // Since context1 is shortest
    }
  }

  @Test
  fun qualityEvaluationAverageForDirectChildrenWorks() {
    val x =
        builder.node { n ->
          n.nodeType(NodeType.SUBJECT)
              .name("S1")
              .publicId("urn:subject:1")
              .qualityEvaluation(Grade.Five)
              .child(NodeType.RESOURCE) { t ->
                t.nodeType(NodeType.RESOURCE).name("R1").qualityEvaluation(Grade.Four)
              }
              .child(NodeType.RESOURCE) { t ->
                t.nodeType(NodeType.RESOURCE).name("R2").qualityEvaluation(Grade.Three)
              }
              .child(NodeType.RESOURCE) { t ->
                t.nodeType(NodeType.RESOURCE).name("R3").qualityEvaluation(Grade.Five)
              }
              .child(NodeType.RESOURCE) { t ->
                t.nodeType(NodeType.RESOURCE).name("R4").qualityEvaluation(Grade.Three)
              }
        }

    x.updateEntireAverageTree()

    val avg = x.childQualityEvaluationAverage
    assertNotNull(avg)
    assertEquals(3.75, avg.averageValue)
    assertEquals(4, avg.count)
  }

  @Test
  fun qualityEvaluationAverageForNestedChildrenWorks() {
    val parentNode =
        builder.node { n ->
          n.nodeType(NodeType.SUBJECT)
              .name("S1")
              .qualityEvaluation(Grade.Five)
              .child(NodeType.TOPIC) { t ->
                t.nodeType(NodeType.TOPIC)
                    .name("T1")
                    .qualityEvaluation(Grade.Four)
                    .child(NodeType.RESOURCE) { r ->
                      r.nodeType(NodeType.RESOURCE).name("R5").qualityEvaluation(Grade.Two)
                    }
                    .child(NodeType.RESOURCE) { r ->
                      r.nodeType(NodeType.RESOURCE).name("R1").qualityEvaluation(Grade.Five)
                    }
              }
              .child(NodeType.TOPIC) { t ->
                t.nodeType(NodeType.TOPIC).name("T2").qualityEvaluation(Grade.Three).child(
                    NodeType.RESOURCE) { r ->
                      r.nodeType(NodeType.RESOURCE).name("R2").qualityEvaluation(Grade.Three)
                    }
              }
              .child(NodeType.TOPIC) { t ->
                t.nodeType(NodeType.TOPIC).name("T3").qualityEvaluation(Grade.Five).child(
                    NodeType.RESOURCE) { r ->
                      r.nodeType(NodeType.RESOURCE).name("R3").qualityEvaluation(Grade.One)
                    }
              }
              .child(NodeType.TOPIC) { t ->
                t.nodeType(NodeType.TOPIC).name("T4").qualityEvaluation(Grade.Three).child(
                    NodeType.RESOURCE) { r ->
                      r.nodeType(NodeType.RESOURCE).name("R4").qualityEvaluation(Grade.Two)
                    }
              }
        }
    val unrelatedNodes =
        builder.node(NodeType.SUBJECT) { n ->
          n.name("S2").qualityEvaluation(Grade.One).child(NodeType.TOPIC) { t ->
            t.name("T5").qualityEvaluation(Grade.Five).child(NodeType.RESOURCE) { r ->
              r.name("R6").qualityEvaluation(Grade.Four)
            }
          }
        }
    unrelatedNodes.updateEntireAverageTree()
    parentNode.updateEntireAverageTree()
    val avg = parentNode.childQualityEvaluationAverage
    assertNotNull(avg)
    assertEquals(2.6, avg.averageValue)
    assertEquals(5, avg.count)
  }

  @Test
  fun qualityEvaluationAverageIgnoresLinkChildren() {
    val linkedTopic =
        builder.node(NodeType.TOPIC) { topic ->
          topic.name("Linked topic").child(NodeType.RESOURCE) { resource ->
            resource.name("Linked resource").qualityEvaluation(Grade.One)
          }
        }

    val parentNode =
        builder.node(NodeType.SUBJECT) { subject ->
          subject
              .name("S1")
              .child(NodeType.TOPIC) { topic ->
                topic.name("Branch topic").child(NodeType.RESOURCE) { resource ->
                  resource.name("Branch resource").qualityEvaluation(Grade.Four)
                }
              }
              .link(linkedTopic)
        }

    parentNode.updateEntireAverageTree()

    val avg = parentNode.childQualityEvaluationAverage
    assertNotNull(avg)
    assertEquals(4.0, avg.averageValue)
    assertEquals(1, avg.count)
  }

  fun testAverageAndCount(node: Node, expectedAverage: Double, expectedCount: Int) {
    val avg = node.childQualityEvaluationAverage
    assertNotNull(avg)
    assertEquals(expectedAverage, avg.averageValue)
    assertEquals(expectedCount, avg.count)
  }

  @Test
  fun qualityEvaluationPartialCalulationWorksAsExpected() {
    val parent = builder.node { n -> n.nodeType(NodeType.SUBJECT) }
    parent.updateChildQualityEvaluationAverage(null, Grade.Five)
    testAverageAndCount(parent, 5.0, 1)

    parent.updateChildQualityEvaluationAverage(null, Grade.Five)
    testAverageAndCount(parent, 5.0, 2)

    parent.updateChildQualityEvaluationAverage(null, Grade.Three)
    testAverageAndCount(parent, 4.333333333333333, 3)

    parent.updateChildQualityEvaluationAverage(Grade.Three, Grade.Four)
    testAverageAndCount(parent, 4.666666666666667, 3)

    parent.updateChildQualityEvaluationAverage(Grade.Four, null)
    testAverageAndCount(parent, 5.0, 2)
  }

  @Test
  fun removing_last_grade_does_not_leave_negative_sum() {
    val parent = builder.node { n -> n.nodeType(NodeType.SUBJECT) }
    ReflectionTestUtils.setField(parent, "childQualityEvaluationSum", 1)
    ReflectionTestUtils.setField(parent, "childQualityEvaluationCount", 1)

    parent.updateChildQualityEvaluationAverage(Grade.Two, null)

    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationSum"))
    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationCount"))
  }

  @Test
  fun average_is_missing_when_count_is_zero_even_if_sum_is_nonzero() {
    val parent = builder.node { n -> n.nodeType(NodeType.SUBJECT) }
    ReflectionTestUtils.setField(parent, "childQualityEvaluationSum", -2)
    ReflectionTestUtils.setField(parent, "childQualityEvaluationCount", 0)

    assertNull(parent.childQualityEvaluationAverage)
  }

  @Test
  fun removing_more_than_exists_resets_average_to_zero() {
    val parent = builder.node { n -> n.nodeType(NodeType.SUBJECT) }
    ReflectionTestUtils.setField(parent, "childQualityEvaluationSum", 5)
    ReflectionTestUtils.setField(parent, "childQualityEvaluationCount", 1)

    parent.removeGradeAverageTreeFromAverageCalculation(GradeAverage(5, 2))

    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationSum"))
    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationCount"))
  }

  @Test
  fun removing_grade_with_positive_count_but_nonpositive_sum_resets_average() {
    val parent = builder.node { n -> n.nodeType(NodeType.SUBJECT) }
    ReflectionTestUtils.setField(parent, "childQualityEvaluationSum", 1)
    ReflectionTestUtils.setField(parent, "childQualityEvaluationCount", 2)

    parent.updateChildQualityEvaluationAverage(Grade.Two, null)

    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationSum"))
    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationCount"))
  }

  @Test
  fun removing_average_tree_with_positive_count_but_nonpositive_sum_resets_average() {
    val parent = builder.node { n -> n.nodeType(NodeType.SUBJECT) }
    ReflectionTestUtils.setField(parent, "childQualityEvaluationSum", 1)
    ReflectionTestUtils.setField(parent, "childQualityEvaluationCount", 2)

    parent.removeGradeAverageTreeFromAverageCalculation(GradeAverage(2, 1))

    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationSum"))
    assertEquals(0, ReflectionTestUtils.getField(parent, "childQualityEvaluationCount"))
  }
}
