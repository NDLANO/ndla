/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import no.ndla.taxonomy.domain.DomainEntity
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.integration.DraftApiClient
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.service.exceptions.DuplicateConnectionException
import no.ndla.taxonomy.service.exceptions.InvalidArgumentServiceException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Transactional(propagation = Propagation.MANDATORY)
@Service
class NodeConnectionService(
    private val nodeConnectionRepository: NodeConnectionRepository,
    private val contextUpdaterService: ContextUpdaterService,
    private val nodeRepository: NodeRepository,
    private val qualityEvaluationService: QualityEvaluationService,
    private val draftApiClient: DraftApiClient,
) {
  private fun doCreateConnection(
      parent: Node,
      child: Node,
      requestedPrimary: Boolean,
      relevance: Relevance,
      rank: Int,
      connectionType: NodeConnectionType,
  ): NodeConnection {
    val primary =
        if (child.getParentConnections().isEmpty()) {
          // First connected is always primary regardless of request
          true
        } else {
          requestedPrimary
        }

    val connection = NodeConnection.create(parent, child, relevance, connectionType, primary)

    try {
      updatePrimaryConnection(connection, primary)
    } catch (e: InvalidArgumentServiceException) {
      // Only if setting the first node to non-primary, which we don't because we force
      // the first node to always become primary
      throw RuntimeException(e)
    }

    updateRank(connection, rank)

    contextUpdaterService.updateContexts(child)

    return connection
  }

  private fun createConnection(
      parent: Node,
      child: Node,
      relevance: Relevance,
      rank: Int,
      isPrimary: Boolean?,
      connectionType: NodeConnectionType,
  ): NodeConnection =
      doCreateConnection(parent, child, isPrimary ?: true, relevance, rank, connectionType)

  @JvmOverloads
  fun connectParentChild(
      parent: Node,
      child: Node,
      relevance: Relevance,
      rank: Int?,
      isPrimary: Boolean? = null,
      connectionType: NodeConnectionType = NodeConnectionType.BRANCH,
  ): NodeConnection {
    // Acquire the QE lock before any lazy-loaded collection access on parent/child/ancestors.
    // The loop-detection and rank logic below initializes parent.parentConnections; if the
    // lock were taken later (inside updateQualityEvaluationOfNewConnection), the QE recursion
    // could walk a stale tree committed by a concurrent QE-holding transaction.
    qualityEvaluationService.lockForConnectionChange(connectionType)

    if (child.getParentConnections().isNotEmpty()) {
      if (connectionType == NodeConnectionType.BRANCH && child.nodeType == NodeType.TOPIC)
          throw DuplicateConnectionException()

      val alreadyConnected =
          parent.getChildConnections().any { connection ->
            connection.child === child && connection.connectionType == connectionType
          }

      if (alreadyConnected) {
        throw DuplicateConnectionException()
      }
    }

    if (parent === child) {
      throw InvalidArgumentServiceException("Cannot connect node to itself")
    }

    var parentConnected = parent

    var ttl = 100
    while (true) {
      parentConnected = parentConnected.getParentConnections().firstOrNull()?.parent ?: break

      if (ttl-- < 0) {
        throw InvalidArgumentServiceException("Too many levels to get top level object")
      }
      if (parentConnected === child) {
        throw InvalidArgumentServiceException("Loop detected when trying to connect")
      }
    }

    val newRank = rank ?: ((parent.getChildConnections().maxOfOrNull { it.rank } ?: 0) + 1)

    val newConnection =
        createConnection(parent, child, relevance, newRank, isPrimary, connectionType)
    qualityEvaluationService.updateQualityEvaluationOfNewConnection(newConnection)
    if (shouldUpdateDraftNotes(newConnection)) {
      draftApiClient.updateNotesWithNewConnection(newConnection)
    }
    return nodeConnectionRepository.saveAndFlush(newConnection)
  }

  fun disconnectParentChild(parent: Node, child: Node) {
    HashSet(parent.getChildConnections())
        .asSequence()
        .filter { connection -> connection.child === child }
        .forEach { disconnectParentChildConnection(it) } // (It will never be more than one record)
  }

  fun disconnectParentChildConnection(nodeConnection: NodeConnection) {
    val child = nodeConnection.child

    qualityEvaluationService.removeQualityEvaluationOfDeletedConnection(nodeConnection)
    if (shouldUpdateDraftNotes(nodeConnection)) {
      draftApiClient.updateNotesWithDeletedConnection(nodeConnection)
    }

    nodeConnection.disassociate()
    nodeConnectionRepository.delete(nodeConnection)

    if (child != null) {
      if (child.nodeType == NodeType.RESOURCE) {
        // Set next connection to primary if disconnecting the primary connection
        val isPrimaryConnection = nodeConnection.isPrimary
        if (isPrimaryConnection) {
          child
              .getParentConnections()
              .firstOrNull { c -> c.connectionType == nodeConnection.connectionType }
              ?.let { nextConnection ->
                nextConnection.isPrimary = true
                nodeConnectionRepository.saveAndFlush(nextConnection)
                nextConnection.resource?.let { contextUpdaterService.updateContexts(it) }
              }
        }
      }
      contextUpdaterService.updateContexts(child)
    }

    nodeConnectionRepository.flush()
  }

  private fun saveConnections(connections: Collection<NodeConnection>) {
    connections.forEach { nodeConnectionRepository.save(it) }
    nodeConnectionRepository.flush()
  }

  private fun updatePrimaryConnection(connectable: NodeConnection, setPrimaryTo: Boolean) {
    val updatedConnectables = HashSet<NodeConnection>()
    updatedConnectables.add(connectable)

    // Updates all other nodes connected to this parent
    var foundNewPrimary = false
    connectable.child?.let { node ->
      val theOthers =
          node.getParentConnections().filter { c ->
            connectable.connectionType == c.connectionType && c !== connectable
          }
      val hasPrimary =
          theOthers.any { c -> connectable.connectionType == c.connectionType && c.isPrimary }
      foundNewPrimary = hasPrimary
      theOthers.forEach { connectable1 ->
        if (!setPrimaryTo && !foundNewPrimary) {
          // Setting the first to primary since no of the others are primary
          connectable1.isPrimary = true
          foundNewPrimary = true
          updatedConnectables.add(connectable1)
        } else if (setPrimaryTo && connectable.connectionType == NodeConnectionType.BRANCH) {
          if (shouldUpdateDraftNotes(connectable1)) {
            draftApiClient.updatePrimaryNotesWithUpdatedConnection(connectable1, false)
          }
          connectable1.isPrimary = false
          updatedConnectables.add(connectable1)
        }
      }
    }

    connectable.isPrimary = setPrimaryTo

    saveConnections(updatedConnectables)

    updatedConnectables.forEach { updatedConnectable ->
      updatedConnectable.child?.let { contextUpdaterService.updateContexts(it) }
    }

    if (!setPrimaryTo && !foundNewPrimary) {
      throw InvalidArgumentServiceException(
          "Requested to set non-primary, but cannot find another node to set primary")
    }
  }

  private fun updateRank(rankable: NodeConnection, newRank: Int) {
    val updatedConnections =
        RankableConnectionUpdater.rank(
            ArrayList(
                checkNotNull(rankable.parent) { "Rankable parent not found" }
                    .getChildConnections()),
            rankable,
            newRank,
        )
    saveConnections(updatedConnections)
  }

  private fun updateRelevance(connection: NodeConnection, relevance: Relevance?) {
    connection.relevance = relevance

    this.saveConnections(listOf(connection))
  }

  fun updateParentChild(
      nodeConnection: NodeConnection,
      newRelevance: Relevance?,
      newRank: Int?,
      isPrimary: Boolean?,
  ) {
    if (shouldUpdateDraftNotes(nodeConnection)) {
      draftApiClient.updateRelevanceNotesWithUpdatedConnection(nodeConnection, newRelevance!!)
      draftApiClient.updatePrimaryNotesWithUpdatedConnection(nodeConnection, isPrimary ?: false)
    }
    newRank?.let { updateRank(nodeConnection, it) }
    isPrimary?.let { updatePrimaryConnection(nodeConnection, it) }
    updateRelevance(nodeConnection, newRelevance)

    if (shouldUpdateContexts(nodeConnection, newRelevance, isPrimary))
        nodeConnection.child?.let { contextUpdaterService.updateContexts(it) }
  }

  private fun shouldUpdateContexts(
      nodeConnection: NodeConnection,
      newRelevance: Relevance?,
      isPrimary: Boolean?,
  ): Boolean = isPrimary != null || nodeConnection.relevance != newRelevance

  private fun shouldUpdateDraftNotes(nodeConnection: NodeConnection): Boolean =
      nodeConnection.child?.contextType != "learningpath"

  fun replacePrimaryConnectionsFor(entity: Node) {
    entity
        .getChildConnections()
        .asSequence()
        .filter { connection -> connection.isPrimary }
        .forEach { connection ->
          try {
            updatePrimaryConnection(connection, false)
          } catch (_: InvalidArgumentServiceException) {}
        }
  }

  fun getParentConnections(entity: Node): Collection<NodeConnection> {
    // (applies to both getChildConnections and getParentConnections)
    //
    // While this method will work on any objects implementing the EntityWithPath interface
    // there is an
    // optimized path for Topic objects that will perform better than just reading from the
    // probably
    // lazy initialized properties of the object

    return entity.getParentConnections()
  }

  fun getChildConnections(entity: Node): Collection<NodeConnection> = entity.getChildConnections()

  fun disconnectAllParents(entity: Node) {
    entity.getParentConnections().toSet().forEach { disconnectParentChildConnection(it) }
  }

  fun disconnectAllChildren(entity: Node) {
    entity.getChildConnections().toSet().forEach { disconnectParentChildConnection(it) }
  }

  @Transactional
  fun disconnectAllInvisibleNodes(): DomainEntity? {
    disconnectInvisibleConnectionsBatch()
    return null
  }

  /** Efficiently disconnects all invisible nodes using batch SQL operations. */
  private fun disconnectInvisibleConnectionsBatch() {
    val deletedCount = nodeConnectionRepository.deleteConnectionsWhereChildIsInvisible()

    if (deletedCount > 0) {
      nodeRepository.clearContextsForInvisibleNodes()
    }
  }
}
