/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.rest.v1.dtos.NodeConnectionDTO
import no.ndla.taxonomy.rest.v1.dtos.NodeConnectionPOST
import no.ndla.taxonomy.rest.v1.dtos.NodeConnectionPUT
import no.ndla.taxonomy.service.dtos.MetadataDTO
import no.ndla.taxonomy.service.dtos.NodeChildDTO
import no.ndla.taxonomy.service.dtos.SearchResultDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.core.type.TypeReference

class NodeConnectionsTest : RestTest() {

  @BeforeEach
  fun add_core_relevance() {
    nodeRepository.deleteAllAndFlush()
    nodeConnectionRepository.deleteAllAndFlush()
  }

  @Test
  fun can_add_child_to_parent() {
    val calculusId = builder.node(NodeType.TOPIC) { t -> t.name("calculus") }.publicId
    val integrationId = builder.node(NodeType.TOPIC) { t -> t.name("integration") }.publicId

    val id =
        TestUtils.getId(
            testUtils.createResource(
                "/v1/node-connections",
                NodeConnectionPOST().apply {
                  parentId = calculusId
                  childId = integrationId
                },
            ))

    val connection = nodeConnectionRepository.findByPublicId(id)

    val calculus = nodeRepository.getByPublicId(calculusId)
    assertEquals(1, calculus.childNodes.size)
    TestUtils.assertAnyTrue(calculus.childNodes) { t -> "integration" == t.name }
    assertNotNull(connection)
  }

  @Test
  fun cannot_add_existing_child_to_parent() {
    val integrationId =
        builder.node("integration", NodeType.TOPIC) { t -> t.name("integration") }.publicId
    val calculusId =
        builder.node(NodeType.TOPIC) { t -> t.name("calculus").child("integration") }.publicId

    testUtils.createResource(
        "/v1/node-connections",
        NodeConnectionPOST().apply {
          parentId = calculusId
          childId = integrationId
        },
        status().isConflict(),
    )
  }

  @Test
  fun can_add_context_child_to_parent() {
    val integrationId =
        builder
            .node("integration", NodeType.TOPIC) { t -> t.isContext(true).name("integration") }
            .publicId
    val calculusId = builder.node(NodeType.TOPIC) { t -> t.name("calculus") }.publicId

    testUtils.createResource(
        "/v1/node-connections",
        NodeConnectionPOST().apply {
          parentId = calculusId
          childId = integrationId
        },
        status().is2xxSuccessful(),
    )
  }

  @Test
  fun can_delete_parent_child() {
    val id = save(NodeConnection.create(newTopic(), newTopic(), Relevance.CORE)).publicId
    testUtils.deleteResource("/v1/node-connections/$id")
    assertNull(nodeRepository.findByPublicId(id))
  }

  @Test
  fun can_get_nodes() {
    val alternatingCurrentId =
        builder.node("ac", NodeType.TOPIC) { t -> t.name("alternating current") }.publicId
    val electricityId =
        builder
            .node(NodeType.TOPIC) { t -> t.name("electricity").child("ac", NodeType.TOPIC) }
            .publicId
    val integrationId =
        builder.node("integration", NodeType.TOPIC) { t -> t.name("integration") }.publicId
    val calculusId =
        builder
            .node(NodeType.TOPIC) { t -> t.name("calculus").child("integration", NodeType.TOPIC) }
            .publicId

    val response = testUtils.getResource("/v1/node-connections")
    val parentChildren = testUtils.getObject(Array<NodeConnectionDTO>::class.java, response)

    assertEquals(2, parentChildren.size)
    TestUtils.assertAnyTrue(parentChildren) { t ->
      electricityId == t.parentId && alternatingCurrentId == t.childId
    }
    TestUtils.assertAnyTrue(parentChildren) { t ->
      calculusId == t.parentId && integrationId == t.childId
    }
    TestUtils.assertAllTrue(parentChildren) { t -> TestUtils.isValidId(t.id) }
  }

  @Test
  fun can_get_node_connections_paginated() {
    val connections = createTenContiguousRankedConnections()

    val response = testUtils.getResource("/v1/node-connections/page?page=1&pageSize=5")
    val page1 =
        testUtils.getObject(
            object : TypeReference<SearchResultDTO<NodeConnectionDTO>>() {}, response)
    assertEquals(5, page1.results.size)

    val response2 = testUtils.getResource("/v1/node-connections/page?page=2&pageSize=5")
    val page2 =
        testUtils.getObject(
            object : TypeReference<SearchResultDTO<NodeConnectionDTO>>() {},
            response2,
        )
    assertEquals(5, page2.results.size)

    val result = page1.results + page2.results

    assertTrue(
        connections.map { it.publicId.toString() }.containsAll(result.map { r -> r.id.toString() }))
  }

  @Test
  fun can_get_node_child() {
    val electricity = newTopic().name("electricity")
    val alternatingCurrent = newTopic().name("alternating current")
    val topicSubtopic = save(NodeConnection.create(electricity, alternatingCurrent, Relevance.CORE))

    val topicid = electricity.publicId
    val subtopicid = alternatingCurrent.publicId
    val id = topicSubtopic.publicId

    val resource = testUtils.getResource("/v1/node-connections/$id")
    val parentChildIndexDocument = testUtils.getObject(NodeConnectionDTO::class.java, resource)

    assertEquals(topicid, parentChildIndexDocument.parentId)
    assertEquals(subtopicid, parentChildIndexDocument.childId)
  }

  @Test
  fun children_have_default_rank() {
    builder.node(NodeType.TOPIC) { t ->
      t.name("electricity")
          .child(NodeType.TOPIC) { st -> st.name("alternating currents") }
          .child(NodeType.TOPIC) { st -> st.name("wiring") }
    }
    val response = testUtils.getResource("/v1/node-connections")
    val children = testUtils.getObject(Array<NodeConnectionDTO>::class.java, response)

    TestUtils.assertAllTrue(children) { st -> st.rank == 0 }
  }

  @Test
  fun chlidren_can_be_created_with_rank() {
    val subject =
        builder.node(NodeType.SUBJECT) { s ->
          s.isContext(true).name("Subject").publicId("urn:subject:1")
        }
    val electricity =
        builder.node(NodeType.TOPIC) { s -> s.name("Electricity").publicId("urn:topic:1") }
    save(NodeConnection.create(subject, electricity, Relevance.CORE))
    val alternatingCurrents =
        builder.node(NodeType.TOPIC) { t ->
          t.name("Alternating currents").publicId("urn:topic:11")
        }
    val wiring = builder.node(NodeType.TOPIC) { t -> t.name("Wiring").publicId("urn:topic:12") }

    testUtils.createResource(
        "/v1/node-connections",
        NodeConnectionPOST().apply {
          parentId = electricity.publicId
          childId = alternatingCurrents.publicId
          rank = 2
        },
    )

    testUtils.createResource(
        "/v1/node-connections",
        NodeConnectionPOST().apply {
          parentId = electricity.publicId
          childId = wiring.publicId
          rank = 1
        },
    )

    val response = testUtils.getResource("/v1/nodes/${subject.publicId}/nodes?recursive=true")
    val topics = testUtils.getObject(Array<NodeChildDTO>::class.java, response)

    assertEquals(electricity.publicId, topics[0].id)
    assertEquals(wiring.publicId, topics[1].id)
    assertEquals(alternatingCurrents.publicId, topics[2].id)
  }

  @Test
  fun can_update_child_rank() {
    val id = save(NodeConnection.create(newTopic(), newTopic(), Relevance.CORE)).publicId
    testUtils.updateResource(
        "/v1/node-connections/$id",
        NodeConnectionPUT().apply {
          primary = true
          rank = 99
        },
    )
    assertEquals(99, nodeConnectionRepository.getByPublicId(id).rank)
  }

  @Test
  fun update_child_rank_modifies_other_contiguous_ranks() {
    val nodeConnections = createTenContiguousRankedConnections() // creates ranks 1, 2, 3, 4, 5,
    // 6, 7, 8, 9, 10
    val mappedRanks = mapConnectionRanks(nodeConnections)

    // make the last object the first
    val updatedConnection = nodeConnections.last()
    assertEquals(10, updatedConnection.rank)
    testUtils.updateResource(
        "/v1/node-connections/${updatedConnection.publicId}",
        NodeConnectionPUT().apply {
          primary = true
          rank = 1
        },
    )
    assertEquals(1, updatedConnection.rank)

    // verify that the other connections have been updated
    for (nodeConnection in nodeConnections) {
      val response = testUtils.getResource("/v1/node-connections/${nodeConnection.publicId}")
      val connectionFromDb = testUtils.getObject(NodeConnectionDTO::class.java, response)
      // verify that the other connections have had their rank bumped up 1
      if (connectionFromDb.id != updatedConnection.publicId) {
        val oldRank = mappedRanks.getValue(connectionFromDb.id.toString())
        assertEquals(oldRank + 1, connectionFromDb.rank)
      }
    }
  }

  @Test
  fun update_child_rank_does_not_alter_noncontiguous_ranks() {

    val nodeConnections = createTenNonContiguousRankedConnections() // creates ranks 1, 2, 3, 4,
    // 5, 60, 70, 80, 90, 100
    val mappedRanks = mapConnectionRanks(nodeConnections)

    // make the last object the first
    val updatedConnection = nodeConnections.last()
    assertEquals(100, updatedConnection.rank)
    testUtils.updateResource(
        "/v1/node-connections/${updatedConnection.publicId}",
        NodeConnectionPUT().apply {
          primary = true
          rank = 1
        },
    )
    assertEquals(1, updatedConnection.rank)

    // verify that the other connections have been updated
    for (nodeConnection in nodeConnections) {
      val response = testUtils.getResource("/v1/node-connections/${nodeConnection.publicId}")
      val connectionFromDb = testUtils.getObject(NodeConnectionDTO::class.java, response)
      // verify that only the contiguous connections are updated
      if (connectionFromDb.id != updatedConnection.publicId) {
        val oldRank = mappedRanks.getValue(connectionFromDb.id.toString())
        if (oldRank <= 5) {
          assertEquals(oldRank + 1, connectionFromDb.rank)
        } else {
          assertEquals(oldRank, connectionFromDb.rank)
        }
      }
    }
  }

  @Test
  fun update_child_rank_higher_rank_does_not_modify_existing_connections() {
    val nodeConnections = createTenContiguousRankedConnections()
    val mappedRanks = mapConnectionRanks(nodeConnections)

    // set rank for last object to higher than any existing
    val updatedConnection = nodeConnections.last()
    assertEquals(10, updatedConnection.rank)
    testUtils.updateResource(
        "/v1/node-connections/${nodeConnections[9].publicId}",
        NodeConnectionPUT().apply {
          primary = true
          rank = 99
        },
    )
    assertEquals(99, updatedConnection.rank)

    // verify that the other connections are unchanged
    for (nodeConnection in nodeConnections) {
      val response = testUtils.getResource("/v1/node-connections/${nodeConnection.publicId}")
      val connection = testUtils.getObject(NodeConnectionDTO::class.java, response)
      if (connection.id != updatedConnection.publicId) {
        assertEquals(mappedRanks.getValue(connection.id.toString()), connection.rank)
      }
    }
  }

  @Test
  fun update_metadata_for_connection() {
    val id = save(NodeConnection.create(newTopic(), newTopic(), Relevance.CORE)).publicId
    testUtils.updateResource(
        "/v1/node-connections/$id/metadata",
        MetadataDTO(setOf("KM123"), false, mapOf("key" to "value")),
        status().isOk(),
    )
    val connection = nodeConnectionRepository.getByPublicId(id)
    assertFalse(connection.metadata.isVisible())
    val codes = connection.metadata.getGrepCodes().mapTo(HashSet()) { it.code }
    assertTrue(codes.contains("KM123"))
    val customFieldValues = connection.getCustomFields()
    assertTrue(customFieldValues.containsKey("key"))
    assertTrue(customFieldValues.containsValue("value"))
  }

  private fun mapConnectionRanks(nodeConnections: List<NodeConnection>): Map<String, Int> {
    val mappedRanks = HashMap<String, Int>()
    for (nc in nodeConnections) {
      mappedRanks[nc.publicId.toString()] = nc.rank
    }
    return mappedRanks
  }

  private fun createTenContiguousRankedConnections(): List<NodeConnection> {
    val connections = ArrayList<NodeConnection>()
    val parent = newTopic()
    for (i in 1..10) {
      val sub = newTopic()
      val nodeConnection = NodeConnection.create(parent, sub, Relevance.CORE)
      nodeConnection.rank = i
      connections.add(nodeConnection)
      save(nodeConnection)
    }
    return connections
  }

  private fun createTenNonContiguousRankedConnections(): List<NodeConnection> {
    val connections = ArrayList<NodeConnection>()
    val parent = newTopic()
    for (i in 1..10) {
      val sub = newTopic()
      val nodeConnection = NodeConnection.create(parent, sub, Relevance.CORE)
      if (i <= 5) {
        nodeConnection.rank = i
      } else {
        nodeConnection.rank = i * 10
      }
      connections.add(nodeConnection)
      save(nodeConnection)
    }
    return connections
  }
}
