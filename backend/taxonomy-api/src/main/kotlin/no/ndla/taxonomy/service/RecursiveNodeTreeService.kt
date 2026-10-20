/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/*
   This class replicates old structure previously implemented as recursive queries in database, methods
   generally just returns flat lists that replicates the old database views
*/
@Transactional(propagation = Propagation.MANDATORY)
@Service
class RecursiveNodeTreeService(private val nodeConnectionRepository: NodeConnectionRepository) {

  private fun addChildIdsRecursively(
      elements: MutableSet<TreeElement>,
      ids: Set<URI>,
      ttl: Int,
      nodeTypes: List<NodeType>,
  ) {
    // Method just takes the list of ids provided and add each of the children it finds to the list,
    // and then recursively runs the same method on each of the found children IDs, once for each
    // level

    val remainingTtl = ttl - 1
    if (remainingTtl < 0) {
      throw IllegalStateException(
          "Recursion limit reached, probably an infinite loop in the structure")
    }

    val idsThisLevel = HashSet<URI>()

    for (nodeConnection in
        nodeConnectionRepository.findAllByNodeIdInIncludingTopicAndSubtopic(ids, nodeTypes)) {
      val child = nodeConnection.child
      val parent = nodeConnection.parent
      if (child == null || parent == null) continue

      if (nodeConnection.connectionType != NodeConnectionType.BRANCH) continue

      val childId = child.publicId
      val parentId = parent.publicId

      elements.add(TreeElement(childId, parentId, nodeConnection.rank))
      idsThisLevel.add(childId)
    }

    if (idsThisLevel.isNotEmpty()) {
      addChildIdsRecursively(elements, idsThisLevel, remainingTtl, nodeTypes)
    }
  }

  @JvmOverloads
  fun getRecursiveNodes(
      node: Node,
      nodeTypes: List<NodeType> = NodeType.entries,
  ): Set<TreeElement> {
    val toReturn = HashSet<TreeElement>()
    toReturn.add(TreeElement(node.publicId, null, 0))

    addChildIdsRecursively(toReturn, setOf(node.publicId), 1000, nodeTypes)

    return toReturn
  }

  class TreeElement(val id: URI, val parentId: URI?, val rank: Int)
}
