/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import kotlin.jvm.optionals.getOrElse
import kotlin.jvm.optionals.getOrNull
import no.ndla.taxonomy.config.Constants
import no.ndla.taxonomy.config.Constants.SubjectCategory
import no.ndla.taxonomy.config.Constants.SubjectType
import no.ndla.taxonomy.domain.LanguageField
import no.ndla.taxonomy.domain.Metadata
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.domain.TaxonomyContext
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.rest.v1.dtos.MetadataPUT
import no.ndla.taxonomy.util.HashUtil
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class ContextUpdaterService(private val nodeConnectionRepository: NodeConnectionRepository) {

  private fun createContext(
      node: Node,
      parentContext: TaxonomyContext,
      parent: Node,
      parentConnection: NodeConnection,
      activeContext: Boolean,
  ): TaxonomyContext {
    val breadcrumbs =
        LanguageField.listFromLists(parentContext.breadcrumbs, LanguageField.fromNode(parent))

    val parentIds = (parentContext.parentIds + parent.publicId.toString()).toMutableList()
    val parentContextIds =
        (parentContext.parentContextIds + parentContext.contextId).toMutableList()
    val contextId = HashUtil.mediumHash(parentContext.contextId + parentConnection.publicId)
    return TaxonomyContext(
        node.publicId.toString(),
        LanguageField.fromNode(node),
        node.nodeType,
        parentContext.rootId,
        parentContext.rootName,
        parentContext.path + node.pathPart,
        breadcrumbs,
        node.contextType.getOrNull(),
        parentIds,
        parentContextIds,
        parentContext.isVisible && node.isVisible(),
        parentContext.isActive && activeContext,
        parentConnection.isPrimary,
        parentContext.isArchived,
        parentConnection.relevance.getOrElse { Relevance.CORE }.id.toString(),
        contextId,
        parentConnection.rank,
        parentConnection.publicId.toString(),
        mutableListOf(),
    )
  }

  /**
   * Computes `node`'s own context set from its BRANCH parent connections. `branchParentsByChild`
   * holds every BRANCH connection relevant to this update, keyed by child publicId, and `cache`
   * holds each parent's already-computed context set. Both are fully populated before this is
   * called, in topological (parents-before-children) order, so no recursion or lazy loading is
   * needed here.
   */
  private fun createContexts(
      node: Node,
      branchParentsByChild: Map<URI, List<NodeConnection>>,
      cache: Map<URI, Set<TaxonomyContext>>,
  ): Set<TaxonomyContext> {
    val fields = node.getCustomFields()
    val activeContext =
        (fields[Constants.SubjectCategory] ?: Constants.Active) in ACTIVE_SUBJECT_CATEGORIES
    val isArchived = fields[Constants.SubjectType] == Constants.ArchiveSubject

    return hashSetOf<TaxonomyContext>().apply {
      // This entity can be root path
      if (node.isContext) {
        val contextId = HashUtil.semiHash(node.publicId)
        add(
            TaxonomyContext(
                node.publicId.toString(),
                LanguageField.fromNode(node),
                node.nodeType,
                node.publicId.toString(),
                LanguageField.fromNode(node),
                node.pathPart,
                LanguageField(),
                node.contextType.getOrNull(),
                mutableListOf(),
                mutableListOf(),
                node.isVisible(),
                activeContext,
                true,
                isArchived,
                Relevance.CORE.id.toString(),
                contextId,
                0,
                "",
                mutableListOf(),
            ))
      }
      branchParentsByChild[node.publicId].orEmpty().forEach { pc ->
        val parent = pc.parent.getOrNull() ?: return@forEach
        val parentContexts = cache[parent.publicId].orEmpty()
        parentContexts.mapTo(this) { createContext(node, it, parent, pc, activeContext) }
      }
    }
  }

  /**
   * Bulk-fetches every node reachable downward from `entity` via any connection type, one query per
   * level of the subtree instead of one lazy-load per node. This is the set of nodes whose context
   * sets will actually be recomputed and persisted.
   */
  private fun collectDescendants(entity: Node): LinkedHashMap<URI, Node> {
    val descendants = LinkedHashMap<URI, Node>()
    descendants[entity.publicId] = entity

    var frontier = listOf(entity)
    while (frontier.isNotEmpty()) {
      val connections =
          nodeConnectionRepository.findAllByParentPublicIdIn(frontier.map { it.publicId })
      val nextFrontier = mutableListOf<Node>()
      connections.forEach { connection ->
        val child = connection.child.getOrNull() ?: return@forEach
        if (descendants.putIfAbsent(child.publicId, child) == null) {
          nextFrontier.add(child)
        }
      }
      frontier = nextFrontier
    }

    return descendants
  }

  /**
   * Starting from every node that needs recomputing, bulk-fetches the full BRANCH ancestor closure
   * needed to build their context chains (a node may have BRANCH parents entirely outside its own
   * subtree, e.g. a resource shared under several subjects). One query per level of the ancestor
   * graph instead of one lazy-load per node. Returns every node touched (descendants and ancestors
   * alike) plus the BRANCH connections needed to walk from child to parent.
   */
  private fun collectAncestorClosure(
      descendants: Map<URI, Node>
  ): Pair<LinkedHashMap<URI, Node>, Map<URI, List<NodeConnection>>> {
    val allNodes = LinkedHashMap(descendants)
    val branchParentsByChild = HashMap<URI, MutableList<NodeConnection>>()

    var frontier = descendants.values.toList()
    while (frontier.isNotEmpty()) {
      val connections =
          nodeConnectionRepository.findAllByChildPublicIdInAndConnectionType(
              frontier.map { it.publicId }, NodeConnectionType.BRANCH)
      val nextFrontier = mutableListOf<Node>()
      connections.forEach { connection ->
        val child = connection.child.getOrNull() ?: return@forEach
        val parent = connection.parent.getOrNull() ?: return@forEach
        branchParentsByChild.getOrPut(child.publicId) { mutableListOf() }.add(connection)
        if (allNodes.putIfAbsent(parent.publicId, parent) == null) {
          nextFrontier.add(parent)
        }
      }
      frontier = nextFrontier
    }

    return Pair(allNodes, branchParentsByChild)
  }

  /**
   * Orders `nodes` so that every BRANCH parent (within this set) comes before its children (Kahn's
   * algorithm), so a single linear pass can compute each node's contexts from its already-computed
   * parents' contexts with no recursion.
   */
  private fun topologicalOrder(
      nodes: Collection<Node>,
      branchParentsByChild: Map<URI, List<NodeConnection>>,
  ): List<Node> {
    val byId = nodes.associateBy { it.publicId }
    val childrenOf = HashMap<URI, MutableList<URI>>()
    val remainingInDegree = HashMap<URI, Int>()

    nodes.forEach { node ->
      val parentIds =
          branchParentsByChild[node.publicId]
              .orEmpty()
              .mapNotNull { it.parent.getOrNull()?.publicId }
              .filter { byId.containsKey(it) }
              .distinct()
      remainingInDegree[node.publicId] = parentIds.size
      parentIds.forEach { childrenOf.getOrPut(it) { mutableListOf() }.add(node.publicId) }
    }

    val queue = ArrayDeque(nodes.filter { remainingInDegree.getValue(it.publicId) == 0 })
    val ordered = ArrayList<Node>(nodes.size)
    while (queue.isNotEmpty()) {
      val node = queue.removeFirst()
      ordered.add(node)
      childrenOf[node.publicId].orEmpty().forEach { childId ->
        val degree = remainingInDegree.getValue(childId) - 1
        remainingInDegree[childId] = degree
        if (degree == 0) queue.add(byId.getValue(childId))
      }
    }

    check(ordered.size == nodes.size) {
      "Cycle detected among BRANCH node connections while computing taxonomy contexts"
    }
    return ordered
  }

  fun updateContexts(node: Node, entityToUpdate: MetadataPUT): Metadata {
    val result = node.metadata.mergeWith(entityToUpdate)
    if (contextAffectingFieldsChanged(node, entityToUpdate)) {
      this.updateContexts(node)
    }
    return result
  }

  fun contextAffectingFieldsChanged(oldNode: Node, entityToUpdate: MetadataPUT): Boolean {
    val oldVisible = oldNode.metadata.isVisible()
    val newVisible = entityToUpdate.visible
    val oldCustomFields = oldNode.metadata.getCustomFields()
    val newCustomFields = entityToUpdate.customFields

    val visibleChanged = oldVisible != newVisible

    val subjectCategoryChanged =
        oldCustomFields[SubjectCategory] != newCustomFields?.get(SubjectCategory)
    val subjectTypeChanged = oldCustomFields[SubjectType] != newCustomFields?.get(SubjectType)
    val customFieldsChanged = subjectCategoryChanged || subjectTypeChanged

    return visibleChanged || customFieldsChanged
  }

  /*
   * Re-creates the Contexts entries for `entity` and every node reachable downward from it, by
   * bulk-fetching the affected subgraph level-by-level and processing it in one topologically
   * ordered pass, instead of recursing through lazily-loaded connections one node at a time.
   */
  @Transactional(propagation = Propagation.MANDATORY)
  fun updateContexts(entity: Node) {
    val descendants = collectDescendants(entity)
    val (allNodes, branchParentsByChild) = collectAncestorClosure(descendants)
    val order = topologicalOrder(allNodes.values, branchParentsByChild)

    val cache = HashMap<URI, Set<TaxonomyContext>>()
    order.forEach { node ->
      cache[node.publicId] = createContexts(node, branchParentsByChild, cache)
    }

    descendants.values.forEach { node ->
      clearContexts(node)
      val contexts = cache.getValue(node.publicId)
      node.contexts = contexts
      node.addContextIds(contexts.mapTo(mutableSetOf()) { it.contextId })
    }
  }

  @Transactional(propagation = Propagation.MANDATORY)
  fun clearContexts(entity: Node) {
    entity.contexts = hashSetOf()
  }

  companion object {
    private val ACTIVE_SUBJECT_CATEGORIES =
        listOf(Constants.Active, Constants.Beta, Constants.OtherResources)
  }
}
