/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.service.dtos.NodeChildDTO
import no.ndla.taxonomy.service.dtos.NodeDTO
import org.hibernate.SessionFactory
import org.hibernate.stat.Statistics
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Guards against N+1 query regressions on the hot read endpoints. The bounds are deliberately
 * generous; the point is that the query count must not scale with the number of nodes returned.
 */
class NodesQueryCountTest : RestTest() {
  @BeforeEach
  fun clearAllRepos() {
    nodeRepository.deleteAllAndFlush()
    nodeConnectionRepository.deleteAllAndFlush()
  }

  private fun statistics(): Statistics {
    val statistics =
        entityManager.entityManagerFactory.unwrap(SessionFactory::class.java).statistics
    statistics.isStatisticsEnabled = true
    return statistics
  }

  /**
   * Flushes builder-created entities and empties the persistence context so the measured request
   * cannot be served from the first-level cache.
   */
  private fun freshStatistics(): Statistics {
    entityManager.flush()
    entityManager.clear()
    val statistics = statistics()
    statistics.clear()
    return statistics
  }

  @Test
  fun get_children_query_count_does_not_scale_with_child_count() {
    val subject =
        builder.node(NodeType.SUBJECT) { s ->
          s.isContext(true).name("subject")
          for (n in 0 until 30) {
            s.child(NodeType.TOPIC) { t ->
              t.name("topic $n").resource { r -> r.name("resource $n") }
            }
          }
        }

    val statistics = freshStatistics()
    val response = testUtils.getResource("/v1/nodes/${subject.publicId}/nodes")
    val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)

    assertEquals(30, nodes.size)
    val queries = statistics.prepareStatementCount
    assertTrue(queries >= 2, "statistics do not seem to measure anything, ran $queries")
    assertTrue(queries <= 8, "expected getChildren to run at most 8 SQL statements, ran $queries")
  }

  @Test
  fun recursive_get_children_query_count_does_not_scale_with_subtree_size() {
    val subject =
        builder.node(NodeType.SUBJECT) { s ->
          s.isContext(true).name("subject")
          for (n in 0 until 15) {
            s.child(NodeType.TOPIC) { t ->
              t.name("topic $n").child(NodeType.TOPIC) { st ->
                st.name("subtopic $n").resource { r -> r.name("resource $n") }
              }
            }
          }
        }

    val statistics = freshStatistics()
    val response =
        testUtils.getResource(
            "/v1/nodes/${subject.publicId}/nodes?recursive=true&nodeType=TOPIC,RESOURCE")
    val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)

    assertEquals(45, nodes.size)
    val queries = statistics.prepareStatementCount
    assertTrue(queries >= 2, "statistics do not seem to measure anything, ran $queries")
    assertTrue(
        queries <= 12,
        "expected recursive getChildren to run at most 12 SQL statements, ran $queries",
    )
  }

  @Test
  fun get_all_nodes_query_count_does_not_scale_with_node_count() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("subject")
      for (n in 0 until 10) {
        s.child(NodeType.TOPIC) { t ->
          t.name("topic $n").child(NodeType.TOPIC) { st ->
            st.name("subtopic $n").resource { r -> r.name("resource $n") }
          }
        }
      }
    }

    val statistics = freshStatistics()
    val response = testUtils.getResource("/v1/nodes?nodeType=RESOURCE")
    val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(10, nodes.size)
    val queries = statistics.prepareStatementCount
    assertTrue(queries >= 2, "statistics do not seem to measure anything, ran $queries")
    assertTrue(queries <= 8, "expected getAllNodes to run at most 8 SQL statements, ran $queries")
  }

  @Test
  fun get_all_nodes_returns_parent_crumbs_from_batched_ancestor_fetch() {
    val subject =
        builder.node(NodeType.SUBJECT) { s ->
          s.isContext(true).name("subject").child(NodeType.TOPIC) { t ->
            t.name("topic").resource { r -> r.name("resource") }
          }
        }
    val topic = subject.childNodes.first()

    freshStatistics()
    val response = testUtils.getResource("/v1/nodes?nodeType=RESOURCE")
    val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(1, nodes.size)
    val contexts = nodes[0].contexts
    assertEquals(1, contexts.size)
    val parents = contexts.first().parents
    assertEquals(2, parents.size)
    assertEquals(subject.publicId, parents[0].id)
    assertEquals(topic.publicId, parents[1].id)
    assertEquals(contexts.first().rootId, parents[0].id)
  }
}
