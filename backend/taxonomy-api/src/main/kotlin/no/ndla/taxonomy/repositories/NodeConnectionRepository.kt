/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.repositories

import java.net.URI
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface NodeConnectionRepository : TaxonomyRepository<NodeConnection> {

  /**
   * Batch delete all connections where the child node has visible = false.
   *
   * @return the number of connections deleted
   */
  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query(
      value =
          """
          DELETE FROM node_connection nc
          WHERE nc.child_id IN (
              SELECT n.id FROM node n WHERE n.visible = false
          )
          """,
      nativeQuery = true,
  )
  fun deleteConnectionsWhereChildIsInvisible(): Int

  @Query(
      """
      SELECT DISTINCT nc
      FROM NodeConnection nc
      JOIN FETCH nc.parent p
      JOIN FETCH nc.child c
      WHERE nc.parent.publicId IN :nodeId
      AND ((:#{#nodeTypes == null} = true) OR c.nodeType in :nodeTypes)
      """)
  fun findAllByNodeIdInIncludingTopicAndSubtopic(
      nodeId: Set<URI>,
      nodeTypes: List<NodeType>?,
  ): List<NodeConnection>

  @Query(
      value =
          """
          SELECT nc.* FROM node_connection nc
          JOIN node c ON nc.child_id = c.id
          JOIN node p ON nc.parent_id = p.id
          WHERE p.public_id IN :nodeIds
          AND (CAST(:resourceTypeIds AS text[]) IS NULL OR c.resource_type_ids && CAST(:resourceTypeIds AS text[]))
          AND (:relevance IS NULL OR nc.relevance = :relevance)
          AND c.node_type = 'RESOURCE'
          """,
      nativeQuery = true,
  )
  fun getResourceBy(
      nodeIds: Set<String>,
      resourceTypeIds: Array<String>?,
      relevance: String?,
  ): List<NodeConnection>

  @Query(
      "SELECT nc FROM NodeConnection nc JOIN FETCH nc.parent JOIN FETCH nc.child c WHERE c.nodeType = :childNodeType")
  fun findAllByChildNodeType(childNodeType: NodeType): List<NodeConnection>

  @Query(
      value = "SELECT nc.id FROM NodeConnection nc ORDER BY nc.id",
      countQuery = "SELECT count(*) from NodeConnection",
  )
  fun findIdsPaginated(pageable: Pageable): Page<Int>

  @Query(
      value =
          """
          SELECT nc
          FROM NodeConnection nc
          JOIN nc.child c
          WHERE c.nodeType = :nodeType
          ORDER BY nc.id
          """,
      countQuery =
          """
          SELECT count(nc)
          FROM NodeConnection nc
          JOIN nc.child c
          WHERE c.nodeType = :nodeType
          """,
  )
  fun findIdsPaginatedByChildNodeType(pageable: Pageable, nodeType: NodeType): Page<NodeConnection>

  @Query("SELECT nc.id FROM NodeConnection nc") fun findAllIds(): List<Int>

  @Query(
      "SELECT DISTINCT nc FROM NodeConnection nc JOIN FETCH nc.parent n JOIN FETCH nc.child c WHERE nc.id in :ids")
  fun findByIds(ids: Collection<Int>): List<NodeConnection>

  @Query(
      "SELECT DISTINCT nc FROM NodeConnection nc JOIN FETCH nc.child c JOIN FETCH nc.parent n WHERE n.publicId = :publicId")
  fun findAllByParentPublicIdIncludingChildAndChildTranslations(publicId: URI): List<NodeConnection>

  @Query(
      """
      SELECT DISTINCT nc
      FROM NodeConnection nc
      JOIN FETCH nc.child c
      WHERE nc.child.publicId IN :childIds
      AND nc.parent.publicId IN :parentIds
      """)
  fun doFindChildConnections(
      childIds: Collection<URI>,
      parentIds: Collection<URI>,
  ): List<NodeConnection>

  fun findChildConnections(
      childIds: Collection<URI>,
      parentIds: Collection<URI>,
  ): List<NodeConnection> {
    if (childIds.isEmpty()) {
      return emptyList()
    }

    return doFindChildConnections(childIds, parentIds)
  }

  fun findFirstByPublicId(publicId: URI): NodeConnection?

  @Query(
      """
      SELECT DISTINCT nc
      FROM NodeConnection nc
      JOIN FETCH nc.parent n
      JOIN FETCH nc.child c
      WHERE nc.parent.id = :parentId
      AND nc.child.id = :childId
      """)
  fun findByParentIdAndChildId(parentId: Int?, childId: Int?): NodeConnection?

  /**
   * Bulk-fetch every connection whose parent is one of the given nodes, regardless of connection
   * type. Used to walk a subtree level-by-level (one query per level) instead of lazy-loading
   * `Node#getChildConnections()` one node at a time.
   */
  @Query(
      """
      SELECT DISTINCT nc
      FROM NodeConnection nc
      JOIN FETCH nc.parent p
      JOIN FETCH nc.child c
      WHERE p.publicId IN :parentIds
      """)
  fun findAllByParentPublicIdIn(parentIds: Collection<URI>): List<NodeConnection>

  /**
   * Bulk-fetch every connection of the given type whose child is one of the given nodes. Used to
   * walk an ancestor chain level-by-level (one query per level) instead of lazy-loading
   * `Node#getParentConnections()` one node at a time.
   */
  @Query(
      """
      SELECT DISTINCT nc
      FROM NodeConnection nc
      JOIN FETCH nc.parent p
      JOIN FETCH nc.child c
      WHERE c.publicId IN :childIds
      AND nc.connectionType = :connectionType
      """)
  fun findAllByChildPublicIdInAndConnectionType(
      childIds: Collection<URI>,
      connectionType: NodeConnectionType,
  ): List<NodeConnection>
}
