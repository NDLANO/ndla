/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import no.ndla.taxonomy.domain.Builder
import no.ndla.taxonomy.domain.Grade
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.domain.UpdateOrDelete
import no.ndla.taxonomy.integration.DraftApiClient
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.rest.v1.commands.NodePostPut
import no.ndla.taxonomy.service.dtos.QualityEvaluationDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertNull
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito.mock
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate

@SpringBootTest
@ExtendWith(SpringExtension::class)
class QualityEvaluationServiceConcurrencyTest : AbstractIntegrationTest() {
  @Autowired private lateinit var nodeRepository: NodeRepository

  @Autowired private lateinit var nodeConnectionRepository: NodeConnectionRepository

  @Autowired private lateinit var qualityEvaluationService: QualityEvaluationService

  @Autowired private lateinit var builder: Builder

  @Autowired private lateinit var transactionManager: PlatformTransactionManager

  private lateinit var transactionTemplate: TransactionTemplate
  private lateinit var connectionService: NodeConnectionService

  @BeforeEach
  fun setUp() {
    transactionTemplate = TransactionTemplate(transactionManager)
    connectionService =
        NodeConnectionService(
            nodeConnectionRepository,
            mock(ContextUpdaterService::class.java),
            nodeRepository,
            qualityEvaluationService,
            mock(DraftApiClient::class.java),
        )
    nodeRepository.deleteAllAndFlush()
  }

  @Test
  fun concurrent_updates_to_same_parent_should_not_lose_quality_evaluation_deltas() {
    val parentId =
        transactionTemplate.execute {
          val parent =
              builder.node(NodeType.TOPIC) { node -> node.name("Parent").publicId("urn:topic:1") }
          parent.publicId
        }

    val loadedParent = CountDownLatch(2)
    val startUpdates = CountDownLatch(1)

    Executors.newFixedThreadPool(2).use { executor ->
      val firstUpdate =
          executor.submit { applyQualityDelta(parentId, Grade.Five, loadedParent, startUpdates) }
      val secondUpdate =
          executor.submit { applyQualityDelta(parentId, Grade.Four, loadedParent, startUpdates) }

      assertTrue(loadedParent.await(5, TimeUnit.SECONDS))
      startUpdates.countDown()

      firstUpdate.get(5, TimeUnit.SECONDS)
      secondUpdate.get(5, TimeUnit.SECONDS)
    }

    val updatedParent = transactionTemplate.execute { nodeRepository.getByPublicId(parentId) }
    val average = updatedParent.childQualityEvaluationAverage!!

    assertEquals(2, average.count)
    assertEquals(4.5, average.averageValue)
  }

  @Test
  fun concurrent_branch_connections_to_same_parent_should_not_lose_quality_evaluation_deltas() {
    val ids =
        transactionTemplate.execute {
          val parent =
              builder.node(NodeType.TOPIC) { node -> node.name("Parent").publicId("urn:topic:3") }
          val firstChild =
              builder.node(NodeType.RESOURCE) { node ->
                node.name("First child").publicId("urn:resource:3").qualityEvaluation(Grade.Five)
              }
          val secondChild =
              builder.node(NodeType.RESOURCE) { node ->
                node.name("Second child").publicId("urn:resource:4").qualityEvaluation(Grade.Four)
              }

          listOf(parent.publicId, firstChild.publicId, secondChild.publicId)
        }
    val parentId = ids[0]

    val loadedParent = CountDownLatch(2)
    val startConnections = CountDownLatch(1)

    Executors.newFixedThreadPool(2).use { executor ->
      val firstConnection =
          executor.submit { connectChild(parentId, ids[1], loadedParent, startConnections) }
      val secondConnection =
          executor.submit { connectChild(parentId, ids[2], loadedParent, startConnections) }

      assertTrue(loadedParent.await(5, TimeUnit.SECONDS))
      startConnections.countDown()

      firstConnection.get(5, TimeUnit.SECONDS)
      secondConnection.get(5, TimeUnit.SECONDS)
    }

    val updatedParent = transactionTemplate.execute { nodeRepository.getByPublicId(parentId) }
    val average = updatedParent.childQualityEvaluationAverage!!

    assertEquals(2, average.count)
    assertEquals(4.5, average.averageValue)
  }

  @Test
  fun concurrent_branch_connection_deletes_from_same_parent_should_not_lose_quality_evaluation_deltas() {
    val ids =
        transactionTemplate.execute {
          val parent =
              builder.node(NodeType.TOPIC) { node ->
                node
                    .name("Parent")
                    .publicId("urn:topic:4")
                    .resource { resource ->
                      resource
                          .name("First child")
                          .publicId("urn:resource:5")
                          .qualityEvaluation(Grade.Five)
                    }
                    .resource { resource ->
                      resource
                          .name("Second child")
                          .publicId("urn:resource:6")
                          .qualityEvaluation(Grade.Four)
                    }
              }

          listOf(parent.publicId, URI.create("urn:resource:5"), URI.create("urn:resource:6"))
        }
    val parentId = ids[0]
    qualityEvaluationService.updateEntireAverageTreeForNode(parentId)

    val loadedParent = CountDownLatch(2)
    val startDeletes = CountDownLatch(1)

    Executors.newFixedThreadPool(2).use { executor ->
      val firstDelete =
          executor.submit { disconnectChild(parentId, ids[1], loadedParent, startDeletes) }
      val secondDelete =
          executor.submit { disconnectChild(parentId, ids[2], loadedParent, startDeletes) }

      assertTrue(loadedParent.await(5, TimeUnit.SECONDS))
      startDeletes.countDown()

      firstDelete.get(5, TimeUnit.SECONDS)
      secondDelete.get(5, TimeUnit.SECONDS)
    }

    val updatedParent = transactionTemplate.execute { nodeRepository.getByPublicId(parentId) }

    assertNull(updatedParent.childQualityEvaluationAverage)
  }

  @Test
  fun concurrent_updates_to_same_child_should_load_old_grade_after_waiting_for_lock() {
    val ids =
        transactionTemplate.execute {
          builder.node(NodeType.TOPIC) { node ->
            node.name("Parent").publicId("urn:topic:2").child(NodeType.RESOURCE) { child ->
              child.name("Child").publicId("urn:resource:2").qualityEvaluation(Grade.Three)
            }
          }

          listOf(URI.create("urn:topic:2"), URI.create("urn:resource:2"))
        }
    val parentId = ids[0]
    val childId = ids[1]

    qualityEvaluationService.updateEntireAverageTreeForNode(parentId)

    val firstUpdateLoadedChild = CountDownLatch(1)
    val continueFirstUpdate = CountDownLatch(1)
    val secondUpdateReadyForLock = CountDownLatch(1)

    Executors.newFixedThreadPool(2).use { executor ->
      val firstUpdate =
          executor.submit {
            applyNodeQualityEvaluationUpdate(
                childId,
                Grade.Five,
                null,
                firstUpdateLoadedChild,
                continueFirstUpdate,
            )
          }

      assertTrue(firstUpdateLoadedChild.await(5, TimeUnit.SECONDS))

      val secondUpdate =
          executor.submit {
            applyNodeQualityEvaluationUpdate(
                childId,
                Grade.Four,
                secondUpdateReadyForLock,
                null,
                null,
            )
          }

      assertTrue(secondUpdateReadyForLock.await(5, TimeUnit.SECONDS))
      continueFirstUpdate.countDown()

      firstUpdate.get(5, TimeUnit.SECONDS)
      secondUpdate.get(5, TimeUnit.SECONDS)
    }

    val updatedParent = transactionTemplate.execute { nodeRepository.getByPublicId(parentId) }
    val average = updatedParent.childQualityEvaluationAverage!!

    assertEquals(1, average.count)
    assertEquals(4.0, average.averageValue)
  }

  private fun applyQualityDelta(
      parentId: URI,
      grade: Grade,
      loadedParent: CountDownLatch,
      startUpdates: CountDownLatch,
  ) {
    val template = TransactionTemplate(transactionManager)
    template.executeWithoutResult {
      val parent = nodeRepository.getByPublicId(parentId)
      loadedParent.countDown()
      await(startUpdates)
      qualityEvaluationService.updateQualityEvaluationOfRecursive(listOf(parent), null, grade)
    }
  }

  private fun connectChild(
      parentId: URI,
      childId: URI,
      loadedParent: CountDownLatch,
      startConnections: CountDownLatch,
  ) {
    val template = TransactionTemplate(transactionManager)
    template.executeWithoutResult {
      val parent = nodeRepository.getByPublicId(parentId)
      val child = nodeRepository.getByPublicId(childId)
      loadedParent.countDown()
      await(startConnections)
      connectionService.connectParentChild(
          parent,
          child,
          Relevance.CORE,
          null,
          null,
          NodeConnectionType.BRANCH,
      )
    }
  }

  private fun disconnectChild(
      parentId: URI,
      childId: URI,
      loadedParent: CountDownLatch,
      startDeletes: CountDownLatch,
  ) {
    val template = TransactionTemplate(transactionManager)
    template.executeWithoutResult {
      val parent = nodeRepository.getByPublicId(parentId)
      val child = nodeRepository.getByPublicId(childId)
      loadedParent.countDown()
      await(startDeletes)
      connectionService.disconnectParentChild(parent, child)
    }
  }

  private fun applyNodeQualityEvaluationUpdate(
      nodeId: URI,
      grade: Grade,
      readyForLock: CountDownLatch? = null,
      loadedNode: CountDownLatch? = null,
      continueUpdate: CountDownLatch? = null,
  ) {
    val template = TransactionTemplate(transactionManager)
    template.executeWithoutResult {
      val command = NodePostPut()
      command.qualityEvaluation = UpdateOrDelete.Update(QualityEvaluationDTO(grade, null))

      readyForLock?.countDown()
      qualityEvaluationService.lockQualityEvaluationIfNeeded(command)

      val node = nodeRepository.getByPublicId(nodeId)
      loadedNode?.countDown()
      if (continueUpdate != null) {
        await(continueUpdate)
      }

      val oldGrade = node.qualityEvaluationGrade
      command.apply(node)
      qualityEvaluationService.updateQualityEvaluationOfParentsFromFreshlyLoadedNode(
          node,
          oldGrade,
          command,
      )
    }
  }

  private fun await(latch: CountDownLatch) {
    try {
      assertTrue(latch.await(5, TimeUnit.SECONDS))
    } catch (e: InterruptedException) {
      Thread.currentThread().interrupt()
      throw RuntimeException(e)
    }
  }
}
