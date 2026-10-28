/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.repositories

import java.net.URI
import java.util.stream.Stream
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface NodeRepository : TaxonomyRepository<Node> {

  /**
   * Batch clear contexts for all invisible nodes. Since invisible nodes are now orphaned (no parent
   * connections), their context data is no longer valid and should be cleared.
   */
  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query(
      value =
          """
          UPDATE node
          SET contexts = '[]'::jsonb
          WHERE visible = false
          """,
      nativeQuery = true,
  )
  fun clearContextsForInvisibleNodes()

  @Query("SELECT DISTINCT n FROM Node n WHERE n.context = :isContext")
  fun findAllByContextIncludingCachedUrlsAndTranslations(isContext: Boolean): List<Node>

  fun findFirstByPublicId(publicId: URI): Node?

  @Query(value = "SELECT n.id FROM Node n ORDER BY n.id", countQuery = "SELECT count(*) from Node")
  fun findIdsPaginated(pageable: Pageable): Page<Int>

  @Query("SELECT n FROM Node n WHERE n.id in :ids") fun findByIds(ids: Collection<Int>): List<Node>

  @Query(
      value =
          """
          SELECT n.public_id, unnest(n.resource_type_ids) AS resource_type_id
          FROM node n
          WHERE n.node_type = 'RESOURCE'
          AND array_length(n.resource_type_ids, 1) > 0
          """,
      nativeQuery = true,
  )
  fun findAllResourceTypeConnections(): List<Array<Any>>

  @Query("SELECT n FROM Node n WHERE n.publicId IN :ids")
  fun findByPublicIds(ids: Collection<URI>): List<Node>

  @Query(
      """
      SELECT n
      FROM Node n
      LEFT JOIN FETCH n.parentConnections pc
      WHERE n.qualityEvaluation IS NOT NULL
      """)
  fun findNodesWithQualityEvaluation(): Stream<Node>

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query(
      """
      UPDATE Node n
      SET n.childQualityEvaluationSum = 0,
          n.childQualityEvaluationCount = 0
      """)
  fun wipeQualityEvaluationAverages()

  @Query(
      """
      SELECT n.id FROM Node n
      LEFT JOIN n.parentConnections pc
      WHERE ((:#{#nodeTypes == null} = true) OR n.nodeType in (:nodeTypes))
      AND ((:#{#publicIds == null} = true) OR n.publicId in (:publicIds))
      AND (:metadataFilterKey IS NULL OR jsonb_extract_path_text(n.customfields, cast(:metadataFilterKey as text)) IS NOT NULL)
      AND (:metadataFilterValue IS NULL OR cast(jsonb_path_query_array(n.customfields, '$.*') as text) like :metadataFilterValue)
      AND (:contentUri IS NULL OR n.contentUri = :contentUri)
      AND (:isContext IS NULL OR n.context = :isContext)
      AND (:isRoot IS NULL OR (pc IS NULL AND n.context = true))
      """)
  fun findIdsFiltered(
      nodeTypes: List<NodeType>?,
      publicIds: List<URI>?,
      metadataFilterKey: String?,
      metadataFilterValue: String?,
      contentUri: URI?,
      isRoot: Boolean?,
      isContext: Boolean?,
  ): List<Int>

  @Query(
      value =
          """
          SELECT n.id FROM Node n
          WHERE (:contextId IS NULL OR n.contextids @> jsonb_build_array(:contextId))
          """,
      nativeQuery = true,
  )
  fun findIdsByContextId(contextId: String?): List<Int>

  @Query(
      value =
          """
          SELECT n.id FROM Node n
          WHERE jsonb_exists_any(n.contextids, CAST(:contextIds AS text[]))
          """,
      nativeQuery = true,
  )
  fun findIdsByContextIds(contextIds: Array<String>): List<Int>

  @Query(
      value = "SELECT n.id FROM Node n where n.nodeType = :nodeType ORDER BY n.id",
      countQuery = "SELECT count(*) from Node n where n.nodeType = :nodeType",
  )
  fun findIdsByTypePaginated(pageable: Pageable, nodeType: NodeType): Page<Int>

  @Query(
      """
      SELECT DISTINCT n FROM Node n
      LEFT JOIN FETCH n.parentConnections pc
      LEFT JOIN FETCH n.childConnections cc
      WHERE n.nodeType = "PROGRAMME"
      AND n.context = true
      """)
  fun findProgrammes(): List<Node>

  @Query(
      """
      SELECT DISTINCT n FROM Node n
      LEFT JOIN FETCH n.parentConnections pc
      WHERE n.contentUri = :contentUri
      """)
  fun findByContentUri(contentUri: URI?): List<Node>
}
