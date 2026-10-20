/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import java.net.URI
import java.util.Random
import no.ndla.taxonomy.TestSeeder
import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.Grade
import no.ndla.taxonomy.domain.GradeAverage
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.ResourceType
import no.ndla.taxonomy.domain.UpdateOrDelete
import no.ndla.taxonomy.rest.v1.commands.NodePostPut
import no.ndla.taxonomy.rest.v1.dtos.NodeConnectionPOST
import no.ndla.taxonomy.service.dtos.ConnectionDTO
import no.ndla.taxonomy.service.dtos.NodeChildDTO
import no.ndla.taxonomy.service.dtos.NodeDTO
import no.ndla.taxonomy.service.dtos.NodeWithParents
import no.ndla.taxonomy.service.dtos.QualityEvaluationDTO
import no.ndla.taxonomy.service.dtos.SearchResultDTO
import no.ndla.taxonomy.service.dtos.TechnicalEvaluationDTO
import no.ndla.taxonomy.service.dtos.TranslationDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assertions.fail
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertNotNull
import org.junit.jupiter.api.assertNull
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.transaction.TestTransaction
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.core.type.TypeReference

class NodesTest : RestTest() {
  @Autowired private lateinit var testSeeder: TestSeeder

  @BeforeEach
  fun clearAllRepos() {
    nodeRepository.deleteAllAndFlush()
    nodeConnectionRepository.deleteAllAndFlush()
  }

  @Test
  fun can_get_single_node() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("maths").publicId("urn:subject:1").child { t ->
        t.nodeType(NodeType.TOPIC)
            .name("trigonometry")
            .contentUri("urn:article:1")
            .publicId("urn:topic:1")
      }
    }

    val response = testUtils.getResource("/v1/nodes/urn:topic:1")
    val node = testUtils.getObject(NodeDTO::class.java, response)

    assertEquals("trigonometry", node.name)
    assertEquals("urn:article:1", node.contentUri.toString())
    assertEquals("/subject:1/topic:1", node.path)
    assertEquals(listOf("maths", "trigonometry"), node.breadcrumbs)

    assertNotNull(node.metadata)
    assertTrue(node.metadata.visible)
  }

  @Test
  fun can_get_single_node_with_wanted_context() {
    val resource =
        builder.node(NodeType.RESOURCE) { r -> r.name("Resource").publicId("urn:resource:1") }
    builder.node(NodeType.SUBJECT) { s1 ->
      s1.isContext(true).name("Subject1").publicId("urn:subject:1").child(NodeType.TOPIC) { t1 ->
        t1.name("Topic1").publicId("urn:topic:1").resource(resource)
      }
    }
    builder.node(NodeType.SUBJECT) { s2 ->
      s2.isContext(true).name("Subject2").publicId("urn:subject:2").child(NodeType.TOPIC) { t2 ->
        t2.name("Topic2").publicId("urn:topic:2").isContext(true).child(resource).child(
            NodeType.TOPIC) { t3 ->
              t3.name("Topic3").publicId("urn:topic:3").resource(resource)
            }
      }
    }

    // Specifying rootId and/or parentId picks wanted path
    run {
      val response = testUtils.getResource("/v1/nodes/urn:resource:1?rootId=urn:subject:1")
      val node = testUtils.getObject(NodeDTO::class.java, response)
      assertEquals("Resource", node.name)
      assertEquals(5, node.contexts.size)
      assertEquals(2, node.context!!.parents.size)
      assertEquals("/subject:1/topic:1/resource:1", node.path)
    }
    run {
      val response = testUtils.getResource("/v1/nodes/urn:resource:1?parentId=urn:topic:1")
      val node = testUtils.getObject(NodeDTO::class.java, response)
      assertEquals("Resource", node.name)
      assertEquals(2, node.context!!.parents.size)
      assertEquals("/subject:1/topic:1/resource:1", node.path)
    }
    run {
      val response = testUtils.getResource("/v1/nodes/urn:resource:1?rootId=urn:subject:2")
      val node = testUtils.getObject(NodeDTO::class.java, response)
      assertEquals("Resource", node.name)
      assertEquals(2, node.context!!.parents.size)
      assertEquals("/subject:2/topic:2/resource:1", node.path)
    }
    run {
      val response = testUtils.getResource("/v1/nodes/urn:resource:1?rootId=urn:topic:2")
      val node = testUtils.getObject(NodeDTO::class.java, response)
      assertEquals("Resource", node.name)
      assertEquals(1, node.context!!.parents.size)
      assertEquals("/topic:2/resource:1", node.path)
    }
    run {
      val response =
          testUtils.getResource("/v1/nodes/urn:resource:1?rootId=urn:topic:2&parentId=urn:topic:3")
      val node = testUtils.getObject(NodeDTO::class.java, response)
      assertEquals("Resource", node.name)
      assertEquals("/topic:2/topic:3/resource:1", node.path)
    }
    run {
      val response =
          testUtils.getResource(
              "/v1/nodes/urn:resource:1?rootId=urn:subject:2&parentId=urn:topic:3")
      val node = testUtils.getObject(NodeDTO::class.java, response)
      assertEquals("Resource", node.name)
      assertEquals(3, node.context!!.parents.size)
      assertEquals("/subject:2/topic:2/topic:3/resource:1", node.path)
    }
  }

  @Test
  fun single_node_has_no_url() {
    builder.node(NodeType.NODE) { t -> t.publicId("urn:node:1") }

    val response = testUtils.getResource("/v1/nodes/urn:node:1")
    val node = testUtils.getObject(NodeDTO::class.java, response)

    assertNull(node.path)
  }

  @Test
  fun single_context_node_has_url() {
    builder.node(NodeType.NODE) { t -> t.isContext(true).publicId("urn:node:1") }

    val response = testUtils.getResource("/v1/nodes/urn:node:1")
    val node = testUtils.getObject(NodeDTO::class.java, response)

    assertEquals("/node:1", node.path)
  }

  @Test
  fun can_get_nodes_by_contentURI() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Basic science").child(NodeType.TOPIC) { t ->
        t.name("photo synthesis")
        t.contentUri(URI.create("urn:test:1"))
      }
    }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").child(NodeType.TOPIC) { t ->
        t.name("trigonometry")
        t.contentUri(URI.create("urn:test:2"))
      }
    }

    run {
      val response = testUtils.getResource("/v1/nodes?contentURI=urn:test:1")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("photo synthesis", nodes[0].name)
      assertEquals(listOf("Basic science", "photo synthesis"), nodes[0].breadcrumbs)
    }

    run {
      val response = testUtils.getResource("/v1/nodes?contentURI=urn:test:2")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("trigonometry", nodes[0].name)
      assertEquals(listOf("Maths", "trigonometry"), nodes[0].breadcrumbs)
    }
  }

  @Test
  fun can_get_nodes_by_contextId() {
    val resource = builder.node(NodeType.RESOURCE) { r -> r.name("Resource") }
    val resource2 = builder.node(NodeType.RESOURCE) { r -> r.name("Resource2") }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Basic science").child(NodeType.TOPIC) { t ->
        t.name("photo synthesis")
        t.contentUri(URI.create("urn:test:1")).resource(resource)
      }
    }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").child(NodeType.TOPIC) { t ->
        t.name("trigonometry")
        t.contentUri(URI.create("urn:test:2")).resource(resource).resource(resource2)
      }
    }

    val fromDB = nodeRepository.findFirstByPublicId(resource.publicId)
    assertNotNull(fromDB)
    assertEquals(2, fromDB.contexts.size)
    val fromDB2 = nodeRepository.findFirstByPublicId(resource2.publicId)
    assertNotNull(fromDB2)
    assertEquals(1, fromDB2.contexts.size)

    // Check fetching by contextid and make sure correct path and breadcrumbs is used
    for (context in fromDB.contexts) {
      val response =
          testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contextId=${context.contextId}")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("Resource", nodes[0].name)
      assertTrue(nodes[0].url!!.endsWith("resource/${context.contextId}"))
      assertEquals(context.path, nodes[0].path)
      assertTrue(nodes[0].breadcrumbs.containsAll(context.breadcrumbs["nb"]!!))
    }

    // Check fetching by contextids. This does not guarantee url and breadcrumbs
    for (context in fromDB.contexts) {
      val response =
          testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contextIds=${context.contextId}")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("Resource", nodes[0].name)
      assertTrue(nodes[0].paths.contains(context.path))
    }

    // Check fetching by all contextids. This does not guarantee url and breadcrumbs
    val contextIds = fromDB.contextIds
    contextIds.addAll(fromDB2.contextIds)
    val response =
        testUtils.getResource(
            "/v1/nodes?nodeType=RESOURCE&contextIds=" + contextIds.joinToString(","))
    val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
    assertEquals(2, nodes.size)
  }

  @Test
  fun can_get_moved_nodes_by_contextId() {
    val resource = builder.node(NodeType.RESOURCE) { r -> r.name("Resource") }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Basic science").child(NodeType.TOPIC) { t ->
        t.name("photo synthesis")
        t.contentUri(URI.create("urn:test:1")).resource(resource)
      }
    }

    val fromDB = nodeRepository.findFirstByPublicId(resource.publicId)
    assertNotNull(fromDB)
    val node = fromDB
    assertEquals(1, node.contexts.size)
    val contextId = node.contextIds.first()

    // Disconnect from original placement
    nodeConnectionRepository.delete(node.getParentConnections().first())

    // Add resource to new placement
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").child(NodeType.TOPIC) { t ->
        t.name("trigonometry")
        t.contentUri(URI.create("urn:test:2")).resource(resource)
      }
    }

    // Try fetching by old contextid
    val response = testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contextId=$contextId")
    val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
    assertEquals(1, nodes.size)
    assertEquals("Resource", nodes[0].name)
    // Should not be the old contextid
    assertFalse(nodes[0].url!!.endsWith("resource/$contextId"))
  }

  @Test
  fun can_get_nodes_by_key_and_value() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Basic science").child { t ->
        t.nodeType(NodeType.TOPIC)
        t.name("photo synthesis")
        t.contentUri(URI.create("urn:test:1"))
        t.grepCode("GREP1")
        t.customField("test", "value")
      }
    }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").child(NodeType.TOPIC) { t ->
        t.name("trigonometry")
        t.contentUri(URI.create("urn:test:2"))
        t.grepCode("GREP2")
        t.customField("test", "value2")
      }
    }

    run {
      val response = testUtils.getResource("/v1/nodes?value=value")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("photo synthesis", nodes[0].name)
      assertNotNull(nodes[0].metadata)
      assertNotNull(nodes[0].metadata.grepCodes)
      assertEquals(setOf("GREP1"), nodes[0].metadata.grepCodes)
    }
    run {
      val response = testUtils.getResource("/v1/nodes?key=test&value=value")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("photo synthesis", nodes[0].name)
      assertNotNull(nodes[0].metadata)
      assertNotNull(nodes[0].metadata.grepCodes)
      assertEquals(setOf("GREP1"), nodes[0].metadata.grepCodes)
    }
    run {
      val response = testUtils.getResource("/v1/nodes?key=test&value=value2")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("trigonometry", nodes[0].name)
      assertNotNull(nodes[0].metadata)
      assertNotNull(nodes[0].metadata.grepCodes)
      assertEquals(setOf("GREP2"), nodes[0].metadata.grepCodes)
    }
  }

  @Test
  fun can_get_all_nodes() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Basic science").child(NodeType.TOPIC) { t ->
        t.name("photo synthesis")
      }
    }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").child(NodeType.TOPIC) { t -> t.name("trigonometry") }
    }

    val response = testUtils.getResource("/v1/nodes")
    val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
    assertEquals(4, nodes.size)

    TestUtils.assertAnyTrue(nodes) { t -> "Basic science" == t.name }
    TestUtils.assertAnyTrue(nodes) { t -> "Maths" == t.name }
    TestUtils.assertAnyTrue(nodes) { t -> "photo synthesis" == t.name }
    TestUtils.assertAnyTrue(nodes) { t -> "trigonometry" == t.name }
    TestUtils.assertAllTrue(nodes) { t -> TestUtils.isValidId(t.id) }
    TestUtils.assertAllTrue(nodes) { t -> t.path!!.contains("subject") }

    TestUtils.assertAllTrue(nodes) { t -> t.metadata.visible }
    TestUtils.assertAllTrue(nodes) { t -> t.metadata.grepCodes.isEmpty() }
  }

  @Test
  fun can_get_nodes_paginated() {
    val node1 = builder.node(NodeType.NODE)
    val node2 = builder.node(NodeType.NODE)

    val response = testUtils.getResource("/v1/nodes/page?nodeType=NODE&page=1&pageSize=1")
    val page1 = testUtils.getObject(object : TypeReference<SearchResultDTO<NodeDTO>>() {}, response)
    assertEquals(1, page1.results.size)

    val response2 = testUtils.getResource("/v1/nodes/page?nodeType=NODE&page=2&pageSize=1")
    val page2 =
        testUtils.getObject(object : TypeReference<SearchResultDTO<NodeDTO>>() {}, response2)
    assertEquals(1, page2.results.size)

    val result = page1.results + page2.results

    assertTrue(
        listOf(node1, node2)
            .map { it.publicId.toString() }
            .containsAll(result.map { r -> r.id.toString() }))
  }

  @Test
  fun can_get_all_root_nodes() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Basic science").child(NodeType.TOPIC) { t ->
        t.name("photo synthesis")
      }
    }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").child(NodeType.TOPIC) { t -> t.name("trigonometry") }
    }
    builder.node(NodeType.SUBJECT) { s -> s.name("Arts and crafts") }
    builder.node(NodeType.NODE) { n ->
      n.isContext(true).name("Random node").child(NodeType.NODE) { c -> c.name("Subnode") }
    }

    run {
      val response = testUtils.getResource("/v1/nodes?isRoot=true")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(3, nodes.size)
      TestUtils.assertAnyTrue(nodes) { t -> "Basic science" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Maths" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Random node" == t.name }
    }
    run {
      val response = testUtils.getResource("/v1/nodes?isContext=true")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(3, nodes.size)
      TestUtils.assertAnyTrue(nodes) { t -> "Basic science" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Maths" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Random node" == t.name }
    }
    run {
      val response = testUtils.getResource("/v1/nodes?isContext=false")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(4, nodes.size)
      TestUtils.assertAnyTrue(nodes) { t -> "photo synthesis" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "trigonometry" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Arts and crafts" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Subnode" == t.name }
    }
    run {
      val response = testUtils.getResource("/v1/nodes?isContext=true&nodeType=SUBJECT")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(2, nodes.size)
      TestUtils.assertAnyTrue(nodes) { t -> "Basic science" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Maths" == t.name }
    }
    run {
      val response = testUtils.getResource("/v1/nodes?isContext=true")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(3, nodes.size)

      TestUtils.assertAnyTrue(nodes) { t -> "Basic science" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Maths" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Random node" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> t.path!!.contains("subject") }
      TestUtils.assertAllTrue(nodes) { t -> TestUtils.isValidId(t.id) }

      TestUtils.assertAllTrue(nodes) { t -> t.metadata.visible }
      TestUtils.assertAllTrue(nodes) { t -> t.metadata.grepCodes.isEmpty() }
    }
  }

  @Test
  fun can_get_sub_nodes() {
    val subject =
        builder.node(NodeType.SUBJECT) { s ->
          s.isContext(true)
              .name("Basic science")
              .child(NodeType.TOPIC) { t ->
                t.name("photo synthesis").resource { r -> r.name("mithocondria") }
              }
              .child(NodeType.TOPIC) { t ->
                t.name("trigonometry").resource { r -> r.name("angles") }
              }
              .child(NodeType.TOPIC) { t ->
                t.name("Random node").child(NodeType.NODE) { c -> c.name("Subnode") }
              }
        }
    run {
      val response =
          testUtils.getResource(
              "/v1/nodes/${subject.publicId}/nodes?recursive=true&nodeType=TOPIC,RESOURCE,NODE")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(6, nodes.size)

      TestUtils.assertAnyTrue(nodes) { t -> "photo synthesis" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "mithocondria" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "trigonometry" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "angles" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Random node" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Subnode" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> t.path!!.contains("subject") }
      TestUtils.assertAllTrue(nodes) { t -> TestUtils.isValidId(t.id) }

      TestUtils.assertAllTrue(nodes) { t -> t.metadata.visible }
      TestUtils.assertAllTrue(nodes) { t -> t.metadata.grepCodes.isEmpty() }
    }
    run {
      val response =
          testUtils.getResource(
              "/v1/nodes/${subject.publicId}/nodes?recursive=true&nodeType=TOPIC,RESOURCE")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(5, nodes.size)

      TestUtils.assertAnyTrue(nodes) { t -> "photo synthesis" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "mithocondria" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "trigonometry" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "angles" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Random node" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> t.path!!.contains("subject") }
      TestUtils.assertAllTrue(nodes) { t -> TestUtils.isValidId(t.id) }

      TestUtils.assertAllTrue(nodes) { t -> t.metadata.visible }
      TestUtils.assertAllTrue(nodes) { t -> t.metadata.grepCodes.isEmpty() }
    }
    run {
      val response =
          testUtils.getResource("/v1/nodes/${subject.publicId}/nodes?recursive=true&nodeType=TOPIC")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(3, nodes.size)

      TestUtils.assertAnyTrue(nodes) { t -> "photo synthesis" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "trigonometry" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Random node" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> t.path!!.contains("subject") }
      TestUtils.assertAllTrue(nodes) { t -> TestUtils.isValidId(t.id) }

      TestUtils.assertAllTrue(nodes) { t -> t.metadata.visible }
      TestUtils.assertAllTrue(nodes) { t -> t.metadata.grepCodes.isEmpty() }
    }
  }

  @Test
  fun can_filter_nodes() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Basic science").child(NodeType.TOPIC) { t ->
        t.name("photo synthesis")
      }
    }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").isVisible(false).child(NodeType.TOPIC) { t ->
        t.name("trigonometry")
      }
    }
    builder.node(NodeType.SUBJECT) { s -> s.isContext(true).name("Arts and crafts") }
    builder.node(NodeType.NODE) { n ->
      n.isContext(true).name("Random node").child(NodeType.NODE) { c ->
        c.name("Subnode").contentUri("urn:article:1").isVisible(false)
      }
    }

    run {
      val response = testUtils.getResource("/v1/nodes?contentURI=urn:article:1")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(1, nodes.size)
      TestUtils.assertAnyTrue(nodes) { t -> "Subnode" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> t.path!!.contains("node") }
      TestUtils.assertAllTrue(nodes) { t -> TestUtils.isValidId(t.id) }
    }
    run {
      val response = testUtils.getResource("/v1/nodes?nodeType=TOPIC,NODE")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(4, nodes.size)
      TestUtils.assertAnyTrue(nodes) { t -> "photo synthesis" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "trigonometry" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Random node" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Subnode" == t.name }
    }
  }

  @Test
  fun can_filter_nodes_on_ids() {
    val node1 =
        builder.node(NodeType.SUBJECT) { s ->
          s.isContext(true).name("Basic science").publicId("urn:subject:1").child(NodeType.TOPIC) {
              t ->
            t.name("photo synthesis")
          }
        }
    val node2 =
        builder.node(NodeType.SUBJECT) { s ->
          s.isContext(true).name("Maths").isVisible(false).child(NodeType.TOPIC) { t ->
            t.name("trigonometry")
          }
        }
    builder.node(NodeType.SUBJECT) { s -> s.isContext(true).name("Arts and crafts") }
    builder.node(NodeType.NODE) { n ->
      n.isContext(true).name("Random node").child(NodeType.NODE) { c ->
        c.name("Subnode").contentUri("urn:article:1").isVisible(false)
      }
    }

    run {
      val response = testUtils.getResource("/v1/nodes?ids=${node1.publicId},${node2.publicId}")
      val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)
      assertEquals(2, nodes.size)
      TestUtils.assertAnyTrue(nodes) { t -> "Basic science" == t.name }
      TestUtils.assertAnyTrue(nodes) { t -> "Maths" == t.name }
    }
  }

  @Test
  fun fetching_subnodes_uses_correct_context() {
    val resource =
        builder.node(NodeType.RESOURCE) { r -> r.name("Leaf").publicId("urn:resource:1") }
    builder.node(NodeType.SUBJECT) { s1 ->
      s1.isContext(true).name("Subject1").publicId("urn:subject:1").child(NodeType.TOPIC) { t1 ->
        t1.name("Topic1").publicId("urn:topic:1").resource(resource)
      }
    }
    builder.node(NodeType.SUBJECT) { s2 ->
      s2.isContext(true).name("Subject2").publicId("urn:subject:2").child(NodeType.TOPIC) { t2 ->
        t2.name("Topic2").publicId("urn:topic:2").isContext(true).child(NodeType.TOPIC) { t3 ->
          t3.name("Topic3").publicId("urn:topic:3").resource(resource)
        }
      }
    }

    run {
      val response =
          testUtils.getResource(
              "/v1/nodes/urn:subject:1/nodes?nodeType=TOPIC,RESOURCE&recursive=true")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(2, nodes.size)
      TestUtils.assertAllTrue(nodes) { t -> t.path!!.contains("/subject:1/topic:1") }
    }
    run {
      val response = testUtils.getResource("/v1/nodes/urn:topic:1/nodes?nodeType=RESOURCE")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("Leaf", nodes[0].name)
      assertEquals(3, nodes[0].breadcrumbs.size)
      assertEquals("/subject:1/topic:1/resource:1", nodes[0].path)
    }
    run {
      val response =
          testUtils.getResource(
              "/v1/nodes/urn:subject:2/nodes?nodeType=TOPIC,RESOURCE&recursive=true")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(3, nodes.size)
      TestUtils.assertAllTrue(nodes) { t -> t.path!!.contains("/subject:2/topic:2") }
    }
    run {
      // Topic2 is context
      val response =
          testUtils.getResource(
              "/v1/nodes/urn:topic:2/nodes?nodeType=TOPIC,RESOURCE&recursive=true")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(2, nodes.size)
      TestUtils.assertAllTrue(nodes) { t -> t.path!!.contains("/topic:2/topic:3") }
    }
    run {
      val response = testUtils.getResource("/v1/nodes/urn:topic:3/nodes?nodeType=RESOURCE")
      val nodes = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(1, nodes.size)
      assertEquals("Leaf", nodes[0].name)
      // Can't predict which of the two contexts with topic:3 that is picked
      TestUtils.assertAllTrue(nodes) { t -> t.paths.contains("/topic:2/topic:3/resource:1") }
    }
  }

  @Test
  fun can_place_subject_below_subject() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Maths").publicId("urn:subject:1").child(NodeType.SUBJECT) { t ->
        t.name("Maths vg1").contentUri("urn:frontpage:1").publicId("urn:subject:2")
      }
    }

    val response = testUtils.getResource("/v1/nodes/urn:subject:2")
    val node = testUtils.getObject(NodeDTO::class.java, response)

    assertEquals("Maths vg1", node.name)
    assertEquals("urn:frontpage:1", node.contentUri.toString())
    assertEquals("/subject:1/subject:2", node.path)

    assertNotNull(node.metadata)
    assertTrue(node.metadata.visible)
    assertEquals(0, node.metadata.grepCodes.size)
  }

  @Test
  fun create_link_to_another_node() {
    val electricity =
        builder.node(NodeType.TOPIC) { s -> s.name("Electricity").publicId("urn:topic:1") }
    val chemistry =
        builder.node(NodeType.TOPIC) { s -> s.name("Chemistry").publicId("urn:topic:2") }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Physics").publicId("urn:subject:1").child(electricity)
    }
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).name("Biology").publicId("urn:subject:2").child(chemistry).link(electricity)
    }

    run {
      val response = testUtils.getResource("/v1/nodes/urn:subject:1/nodes")
      val children = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(1, children.size)
      assertEquals(URI.create("urn:topic:1"), children[0].id)
      assertEquals("/subject:1/topic:1", children[0].path)
    }
    run {
      val response = testUtils.getResource("/v1/nodes/urn:subject:2/nodes")
      val children = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(1, children.size)
      assertEquals(URI.create("urn:topic:2"), children[0].id)
      assertEquals("/subject:2/topic:2", children[0].path)
    }
    run {
      val response =
          testUtils.getResource(
              "/v1/nodes/urn:subject:2/nodes?connectionTypes=${NodeConnectionType.LINK}")
      val links = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
      assertEquals(1, links.size)
      assertEquals(URI.create("urn:topic:1"), links[0].id)
      assertEquals("/subject:1/topic:1", links[0].path) // Links points to default path
      assertEquals(1, links[0].contexts.size)
    }
  }

  /**
   * This test creates a structure of subjects and topics as follows:
   * <pre>
   *   S:1
   *    \
   *     T:1
   *      \
   *       T:2
   *      /  \
   *    T:3   T:4
   * </pre>
   * <p>
   * S:1 = urn:subject:1000 S:2 = urn:subject:2000 T:1 = urn:topic:1000 T:2 = urn:topic:2000 T:3 =
   * urn:topic:3000 T:4 = urn:topic:4000
   *
   * <p>
   * The test examines the T:2 node and verifies that it reports the correct parent-subject,
   * parent-topic and subtopic connections. As shown in the figure above, it should have 1
   * parent-subject (S:2), 1 parent-topic (T:1), and 2 subtopics (T:3 and T:4).
   */
  @Test
  fun can_get_all_connections() {
    testSeeder.topicNodeConnectionsTestSetup()

    val response = testUtils.getResource("/v1/nodes/urn:topic:2000/connections")
    val connections = testUtils.getObject(Array<ConnectionDTO>::class.java, response)

    assertEquals(3, connections.size, "Correct number of connections")

    connectionsHaveCorrectTypes(connections)
  }

  private fun connectionsHaveCorrectTypes(connections: Array<ConnectionDTO>) {
    val connectionTypeCounter = ConnectionTypeCounter(connections).countTypes()
    assertEquals(0, connectionTypeCounter.subjectCount)
    assertEquals(1, connectionTypeCounter.parentCount)
    assertEquals(2, connectionTypeCounter.childCount)
  }

  @Test
  fun subnodes_are_sorted_by_rank() {
    testSeeder.subtopicsByNodeIdAndRelevanceTestSetup()

    val response = testUtils.getResource("/v1/nodes/urn:topic:1/nodes")
    val subtopics = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
    assertEquals(7, subtopics.size)

    assertEquals("urn:topic:2", subtopics[0].id.toString())
    assertEquals("urn:topic:3", subtopics[1].id.toString())
    assertEquals("urn:topic:4", subtopics[2].id.toString())
    assertEquals("urn:topic:5", subtopics[3].id.toString())
    assertEquals("urn:topic:6", subtopics[4].id.toString())
    assertEquals("urn:topic:7", subtopics[5].id.toString())
  }

  @Test
  fun can_get_unfiltered_subnodes() {
    testSeeder.subtopicsByNodeIdAndRelevanceTestSetup()

    val response = testUtils.getResource("/v1/nodes/urn:topic:1/nodes")
    val subtopics = testUtils.getObject(Array<NodeChildDTO>::class.java, response)
    assertEquals(7, subtopics.size, "Unfiltered subtopics")

    TestUtils.assertAllTrue(subtopics) { subtopic -> subtopic.metadata.visible }
    TestUtils.assertAllTrue(subtopics) { subtopic -> subtopic.metadata.grepCodes.isEmpty() }
  }

  @Test
  fun can_create_node() {
    val createNodeCommand =
        NodePostPut().apply {
          nodeType = NodeType.NODE
          name = "node"
          contentUri = URI.create("urn:article:1")
          context = true
        }

    val response = testUtils.createResource("/v1/nodes", createNodeCommand)
    val id = TestUtils.getId(response)

    val node = nodeRepository.getByPublicId(id)
    assertEquals(NodeType.NODE, node.nodeType)
    assertEquals("node", node.name)
    assertEquals(URI.create("urn:article:1"), node.contentUri)
    assertTrue(node.isContext)
    assertNotNull(node.getCreatedAt())
    assertNotNull(node.getUpdatedAt())
  }

  @Test
  fun can_create_invisible_node() {
    val createNodeCommand =
        NodePostPut().apply {
          nodeType = NodeType.NODE
          name = "node"
          contentUri = URI.create("urn:article:1")
          context = true
          visible = false
        }

    val response = testUtils.createResource("/v1/nodes", createNodeCommand)
    val id = TestUtils.getId(response)

    val node = nodeRepository.getByPublicId(id)
    assertEquals(NodeType.NODE, node.nodeType)
    assertEquals("node", node.name)
    assertEquals(URI.create("urn:article:1"), node.contentUri)
    assertTrue(node.isContext)
    assertFalse(node.isVisible())
  }

  @Test
  fun can_create_topic() {
    val createNodeCommand =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          name = "trigonometry"
          contentUri = URI.create("urn:article:1")
        }

    val response = testUtils.createResource("/v1/nodes", createNodeCommand)
    val id = TestUtils.getId(response)

    val node = nodeRepository.getByPublicId(id)
    assertEquals(NodeType.TOPIC, node.nodeType)
    assertEquals("trigonometry", node.name)
    assertEquals(URI.create("urn:article:1"), node.contentUri)
  }

  @Test
  fun can_create_subject() {
    val createNodeCommand =
        NodePostPut().apply {
          nodeType = NodeType.SUBJECT
          name = "Maths"
          contentUri = URI.create("urn:frontpage:1")
        }

    val response = testUtils.createResource("/v1/nodes", createNodeCommand)
    val id = TestUtils.getId(response)

    val node = nodeRepository.getByPublicId(id)
    assertEquals(NodeType.SUBJECT, node.nodeType)
    assertEquals("Maths", node.name)
    assertEquals(URI.create("urn:frontpage:1"), node.contentUri)
  }

  @Test
  fun can_create_topic_with_id() {
    val createNodeCommand =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          nodeId = "1"
          name = "trigonometry"
        }

    testUtils.createResource("/v1/nodes", createNodeCommand)

    val node = nodeRepository.getByPublicId(createNodeCommand.publicId)
    assertEquals("trigonometry", node.name)
  }

  @Test
  fun creating_node_with_content_uri_is_handled_correct() {
    val createTopic =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          name = "topic"
          contentUri = URI.create("urn:article:1")
        }
    val createResource =
        NodePostPut().apply {
          nodeType = NodeType.RESOURCE
          name = "resource"
          contentUri = URI.create("urn:article:2")
        }

    testUtils.createResource("/v1/nodes", createTopic, status().isCreated())
    testUtils.createResource("/v1/nodes", createTopic, status().isCreated())
    testUtils.createResource("/v1/nodes", createResource, status().isCreated())
    testUtils.createResource("/v1/nodes", createResource, status().isConflict())
  }

  @Test
  fun duplicate_ids_not_allowed() {
    val command =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          nodeId = "1"
          name = "name"
        }

    testUtils.createResource("/v1/nodes", command, status().isCreated())
    testUtils.createResource("/v1/nodes", command, status().isConflict())
  }

  @Test
  fun can_create_node_with_resourcetype() {
    val resourceType = ResourceType.SUBJECT_MATERIAL
    run {
      val createNodeCommand =
          NodePostPut().apply {
            nodeType = NodeType.RESOURCE
            name = "Resource"
            contentUri = URI.create("urn:article:1")
            context = true
            resourceTypes = listOf(ResourceType.SUBJECT_MATERIAL.publicId)
          }

      val response = testUtils.createResource("/v1/nodes", createNodeCommand)
      val id = TestUtils.getId(response)

      val node = nodeRepository.getByPublicId(id)
      assertEquals(NodeType.RESOURCE, node.nodeType)
      assertEquals("Resource", node.name)
      assertEquals(URI.create("urn:article:1"), node.contentUri)
      assertTrue(node.isContext)
      assertNotNull(node.getCreatedAt())
      assertNotNull(node.getUpdatedAt())
      assertEquals(1, node.resourceTypes.size)
    }
    run {
      // Setting resourcetypes only works for resource
      val createNodeCommand =
          NodePostPut().apply {
            nodeType = NodeType.NODE
            name = "Node"
            contentUri = URI.create("urn:article:1")
            context = true
            resourceTypes = listOf(resourceType.publicId)
          }

      val response = testUtils.createResource("/v1/nodes", createNodeCommand)
      val id = TestUtils.getId(response)

      val node = nodeRepository.getByPublicId(id)
      assertEquals(NodeType.NODE, node.nodeType)
      assertEquals("Node", node.name)
      assertEquals(URI.create("urn:article:1"), node.contentUri)
      assertTrue(node.isContext)
      assertNotNull(node.getCreatedAt())
      assertNotNull(node.getUpdatedAt())
      assertEquals(0, node.resourceTypes.size)
    }
  }

  @Test
  fun can_update_node() {
    val n = builder.node()

    testUtils.updateResource(
        "/v1/nodes/${n.publicId}",
        NodePostPut().apply {
          nodeType = n.nodeType
          nodeId = n.ident
          name = "trigonometry"
          contentUri = URI.create("urn:article:1")
        },
    )

    val node = nodeRepository.getByPublicId(n.publicId)
    assertEquals("trigonometry", node.name)
    assertEquals("urn:article:1", node.contentUri.toString())
  }

  @Test
  fun can_update_node_with_new_translations() {
    val n = builder.node()

    testUtils.updateResource(
        "/v1/nodes/${n.publicId}",
        NodePostPut().apply {
          translations = listOf(TranslationDTO("nb", "tester"), TranslationDTO("nn", "testar"))
        },
    )
    val node = nodeRepository.getByPublicId(n.publicId)
    assertEquals("tester", node.getTranslatedName("nb"))
    assertEquals("testar", node.getTranslatedName("nn"))
  }

  @Test
  fun can_update_node_with_new_id() {
    val publicId = builder.node(NodeType.TOPIC).publicId
    val randomId = URI.create("urn:topic:random")

    testUtils.updateResource(
        "/v1/nodes/$publicId",
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          nodeId = "random"
          name = "trigonometry"
          contentUri = URI.create("urn:article:1")
        },
    )

    val node = nodeRepository.getByPublicId(randomId)
    assertEquals("trigonometry", node.name)
    assertEquals("urn:article:1", node.contentUri.toString())
  }

  @Test
  fun can_update_node_with_new_type() {
    val n = builder.node() // NODE
    val ident = n.ident

    val command =
        NodePostPut().apply {
          nodeType = NodeType.SUBJECT
          nodeId = ident
          name = "trigonometry"
          contentUri = URI.create("urn:article:1")
        }

    testUtils.updateResource("/v1/nodes/${n.publicId}", command)

    val node = nodeRepository.getByPublicId(command.publicId)
    assertEquals(NodeType.SUBJECT.typeName + ":" + ident, node.publicId.schemeSpecificPart)
    assertEquals("trigonometry", node.name)
    assertEquals("urn:article:1", node.contentUri.toString())
  }

  @Test
  fun can_update_node_without_changing_metadata() {
    val n = builder.node { s -> s.isVisible(false).grepCode("KM123").customField("key", "value") }

    val command =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          name = "physics"
          contentUri = URI.create("urn:article:1")
        }

    testUtils.updateResource("/v1/nodes/${n.publicId}", command)

    val node = nodeRepository.getByPublicId(n.publicId)
    assertEquals(NodeType.TOPIC, node.nodeType)
    assertEquals("physics", node.name)
    assertEquals(URI.create("urn:article:1"), node.contentUri)

    assertFalse(node.metadata.isVisible())
    assertTrue(node.metadata.getGrepCodes().map { it.code }.contains("KM123"))
    assertTrue(node.getCustomFields().containsValue("value"))
  }

  @Test
  fun can_delete_node_with_2_subnodes() {
    val childTopic1 = builder.node(NodeType.TOPIC) { child -> child.name("DELETE EDGE TO ME") }
    val childTopic2 = builder.node(NodeType.TOPIC) { child -> child.name("DELETE EDGE TO ME ALSO") }

    val parentId =
        builder
            .node(NodeType.TOPIC) { parent -> parent.child(childTopic1).child(childTopic2) }
            .publicId

    testUtils.deleteResource("/v1/nodes/$parentId")

    assertNull(nodeRepository.findByPublicId(parentId))
  }

  @Test
  fun can_delete_node_with_2_resources() {
    val topic =
        builder.node(NodeType.TOPIC) { child ->
          child
              .name("MAIN TOPIC")
              .translation("nb") { tr -> tr.name("HovedEmne") }
              .resource { r -> r.publicId("urn:resource:1") }
              .resource { r -> r.publicId("urn:resource:2") }
        }

    val topicId = topic.publicId

    testUtils.deleteResource("/v1/nodes/$topicId")

    assertNull(nodeRepository.findByPublicId(topicId))
  }

  @Test
  fun can_delete_node_but_subnodes_remain() {
    val childTopic =
        builder.node(NodeType.TOPIC) { child ->
          child
              .name("DELETE EDGE TO ME")
              .translation("nb") { tr -> tr.name("emne") }
              .child(NodeType.TOPIC) { sub -> sub.publicId("urn:topic:1") }
              .resource { r -> r.publicId("urn:resource:1") }
        }

    val parentId = builder.node(NodeType.TOPIC) { parent -> parent.child(childTopic) }.publicId

    testUtils.deleteResource("/v1/nodes/$parentId")

    assertNull(nodeRepository.findByPublicId(parentId))
    assertNotNull(nodeRepository.findByPublicId(childTopic.publicId))
  }

  @Test
  fun can_delete_nodes_but_resources_remain() {
    val x = ResourceType.LEARNING_PATH
    val resource =
        builder.node(NodeType.RESOURCE) { r -> r.translation("nb") { tr -> tr.name("ressurs") } }

    resource.addResourceType(x)
    entityManager.persist(resource)

    val parentId = builder.node(NodeType.TOPIC) { parent -> parent.resource(resource) }.publicId

    testUtils.deleteResource("/v1/nodes/$parentId")

    assertNull(nodeRepository.findByPublicId(parentId))
    assertNotNull(nodeRepository.findByPublicId(resource.publicId))
  }

  @Test
  fun publishing_node_fails_if_no_target_version() {
    val node = builder.node()
    val response =
        testUtils.updateResource(
            "/v1/nodes/${node.publicId}/publish", null, status().is4xxClientError())
    assertEquals(400, response.status)
  }

  @Test
  fun publishing_node_fails_if_node_not_found() {
    val response =
        testUtils.updateResource(
            "/v1/nodes/urn:node:random/publish", null, status().is4xxClientError())
    assertEquals(400, response.status)
  }

  @Test
  fun making_resources_primary_sets_other_contexts_not_primary() {
    val resource = builder.node(NodeType.RESOURCE)
    val resource2 = builder.node(NodeType.RESOURCE)
    val node1 =
        builder.node(NodeType.TOPIC) { n ->
          n.resource(resource, false).child(NodeType.TOPIC) { c ->
            c.publicId("urn:topic:1").resource(resource2, false)
          }
        }
    val node2 =
        builder.node(NodeType.TOPIC) { n ->
          n.resource(resource, true).child(NodeType.TOPIC) { c ->
            c.publicId("urn:topic:2").resource(resource2, true)
          }
        }

    run {
      // Only set primary on one level
      val response =
          testUtils.updateResource(
              "/v1/nodes/${node1.publicId}/makeResourcesPrimary", null, status().isOk())
      assertEquals(200, response.status)
      val updated1 = nodeRepository.getByPublicId(node1.publicId)
      assertTrue(updated1.resourceChildren.all { nr -> nr.isPrimary })
      val updated2 = nodeRepository.getByPublicId(node2.publicId)
      assertFalse(updated2.resourceChildren.all { nr -> nr.isPrimary })
      // Following should be unchanged
      val updated3 = nodeRepository.getByPublicId(URI.create("urn:topic:1"))
      assertFalse(updated3.resourceChildren.all { nr -> nr.isPrimary })
      val updated4 = nodeRepository.getByPublicId(URI.create("urn:topic:2"))
      assertTrue(updated4.resourceChildren.all { nr -> nr.isPrimary })
    }
    run {
      // Recursive flag updates all levels
      val response =
          testUtils.updateResource(
              "/v1/nodes/${node1.publicId}/makeResourcesPrimary?recursive=true",
              null,
              status().isOk(),
          )
      assertEquals(200, response.status)
      val updated1 = nodeRepository.getByPublicId(node1.publicId)
      assertTrue(updated1.resourceChildren.all { nr -> nr.isPrimary })
      val updated2 = nodeRepository.getByPublicId(node2.publicId)
      assertFalse(updated2.resourceChildren.all { nr -> nr.isPrimary })
      // Switched order from previous block
      val updated3 = nodeRepository.getByPublicId(URI.create("urn:topic:1"))
      assertTrue(updated3.resourceChildren.all { nr -> nr.isPrimary })
      val updated4 = nodeRepository.getByPublicId(URI.create("urn:topic:2"))
      assertFalse(updated4.resourceChildren.all { nr -> nr.isPrimary })
    }
  }

  @Test
  fun full_node_has_parents() {
    testSeeder.resourceInDualSubjectsTestSetup()
    run {
      val response = testUtils.getResource("/v1/nodes/urn:resource:1/full")
      val result = testUtils.getObject(NodeWithParents::class.java, response)
      assertNotNull(result.paths)
      assertEquals(2, result.parents.size)
      assertEquals(0, result.contexts.size)
    }
    run {
      val response = testUtils.getResource("/v1/nodes/urn:resource:1/full?includeContexts=true")
      val result = testUtils.getObject(NodeWithParents::class.java, response)
      assertNotNull(result.paths)
      assertEquals(2, result.parents.size)
      assertEquals(2, result.contexts.size)
    }
  }

  @Test
  fun can_clone_node() {
    val publicId =
        builder
            .node(NodeType.RESOURCE) { r ->
              r.name("Resource")
                  .resourceType(ResourceType.SUBJECT_MATERIAL)
                  .translation("nb") { tr -> tr.name("Fagstoff nb") }
                  .contentUri("urn:article:1")
            }
            .publicId

    val command = NodePostPut().apply { contentUri = URI.create("urn:article:2") }
    val id = TestUtils.getId(testUtils.createResource("/v1/nodes/$publicId/clone", command))
    assertNotNull(id)

    val oldRes = nodeRepository.getByPublicId(publicId)
    val newRes = nodeRepository.getByPublicId(id)
    assertNotEquals(publicId, id)
    assertEquals(oldRes.name, newRes.name)
    assertEquals("urn:article:1", oldRes.contentUri.toString())
    assertEquals("urn:article:2", newRes.contentUri.toString())
    assertNotEquals(oldRes.contentUri.toString(), newRes.contentUri.toString())
    assertEquals(oldRes.translations.size, newRes.translations.size)
    assertEquals(oldRes.resourceTypes.size, newRes.resourceTypes.size)

    // contentUri can be null
    val id2 = TestUtils.getId(testUtils.createResource("/v1/nodes/$publicId/clone", NodePostPut()))
    assertNotNull(id2)
    val resWithoutContentUri = nodeRepository.findByPublicId(id2)
    assertNull(resWithoutContentUri!!.contentUri)
  }

  @Test
  fun can_update_delete_and_leave_quality_evaluation() {
    val node = builder.node(NodeType.TOPIC)
    val publicId = node.publicId

    testUtils.updateResourceRawInput(
        "/v1/nodes/$publicId",
        """{"nodeType":"TOPIC","name":"some-name","contentUri":"urn:article:1","qualityEvaluation": {"grade": 5}}""",
    )
    val found = nodeRepository.getByPublicId(publicId)
    assertEquals(found.qualityEvaluationGrade, Grade.Five)

    testUtils.updateResourceRawInput(
        "/v1/nodes/$publicId",
        """{"nodeType":"TOPIC","name":"some-name","contentUri":"urn:article:1"}""",
    )
    val found2 = nodeRepository.getByPublicId(publicId)
    assertEquals(found2.qualityEvaluationGrade, Grade.Five)

    testUtils.updateResourceRawInput(
        "/v1/nodes/$publicId",
        """{"nodeType":"TOPIC","name":"some-name","contentUri":"urn:article:1","qualityEvaluation": null}""",
    )
    val found3 = nodeRepository.getByPublicId(publicId)
    assertNull(found3.qualityEvaluationGrade)
  }

  @Test
  fun update_and_deletion_of_quality_evaluation_does_not_break_calculation() {
    val subjectId = "urn:subject:1"
    val topicId = "urn:topic:1"
    val resourceId = "urn:resource:1"
    builder.node(NodeType.SUBJECT) { n ->
      n.name("S1").publicId(subjectId).child(NodeType.TOPIC) { c ->
        c.name("T1").publicId(topicId).child(NodeType.RESOURCE) { rc ->
          rc.name("R1").publicId(resourceId)
        }
      }
    }

    run {
      // Set quality evaluation on resource and check that average on subject & topic is updated
      testUtils.updateResourceRawInput(
          "/v1/nodes/$resourceId", """{"qualityEvaluation": {"grade": 5}}""")
      val dbResource = nodeRepository.getByPublicId(URI.create(resourceId))
      val dbTopic = nodeRepository.getByPublicId(URI.create(topicId))
      val dbSuject = nodeRepository.getByPublicId(URI.create(subjectId))
      assertEquals(dbResource.qualityEvaluationGrade, Grade.Five)
      val expectedFive = GradeAverage(5, 1)
      assertEquals(dbSuject.childQualityEvaluationAverage, expectedFive)
      assertEquals(dbTopic.childQualityEvaluationAverage, expectedFive)
    }

    run {
      // Remove quality evaluation on resource and check that average on subject & topic is removed
      testUtils.updateResourceRawInput("/v1/nodes/$resourceId", """{"qualityEvaluation": null}""")
      val dbResource = nodeRepository.getByPublicId(URI.create(resourceId))
      val dbTopic = nodeRepository.getByPublicId(URI.create(topicId))
      val dbSuject = nodeRepository.getByPublicId(URI.create(subjectId))
      assertNull(dbResource.qualityEvaluationGrade)
      val actualSubject = dbSuject.childQualityEvaluationAverage
      assertNull(actualSubject)
      val actualTopic = dbTopic.childQualityEvaluationAverage
      assertNull(actualTopic)
    }
  }

  @Test
  fun deleting_resource_updates_parent_quality_evaluation_average() {
    val subjectId = "urn:subject:1"
    val topicId = "urn:topic:1"
    val resourceId = "urn:resource:1"
    builder.node(NodeType.SUBJECT) { n ->
      n.name("S1").publicId(subjectId).child(NodeType.TOPIC) { c ->
        c.name("T1").publicId(topicId).child(NodeType.RESOURCE) { rc ->
          rc.name("R1").publicId(resourceId)
        }
      }
    }

    testUtils.updateResourceRawInput(
        "/v1/nodes/$resourceId", """{"qualityEvaluation": {"grade": 2}}""")
    val dbTopic = nodeRepository.getByPublicId(URI.create(topicId))
    val dbSubject = nodeRepository.getByPublicId(URI.create(subjectId))
    assertNotNull(dbTopic.childQualityEvaluationAverage)
    assertNotNull(dbSubject.childQualityEvaluationAverage)

    testUtils.deleteResource("/v1/nodes/$resourceId")

    val dbTopicAfter = nodeRepository.getByPublicId(URI.create(topicId))
    val dbSubjectAfter = nodeRepository.getByPublicId(URI.create(subjectId))
    assertNull(dbTopicAfter.childQualityEvaluationAverage)
    assertNull(dbSubjectAfter.childQualityEvaluationAverage)
  }

  @Test
  fun update_and_clone_topic_resource_and_quality_evaluation_matches() {
    // Create structure with resources and quality evaluation
    val parent =
        builder.node(NodeType.SUBJECT) { s1 ->
          s1.name("S1")
              .publicId("urn:subject:1")
              .child(NodeType.TOPIC) { t1 ->
                t1.name("T1")
                    .publicId("urn:topic:1")
                    .child(NodeType.RESOURCE) { r1 ->
                      r1.name("R1").publicId("urn:resource:1").qualityEvaluation(Grade.Five)
                    }
                    .child(NodeType.RESOURCE) { r2 ->
                      r2.name("R2").publicId("urn:resource:2").qualityEvaluation(Grade.Four)
                    }
                    .child(NodeType.RESOURCE) { r3 ->
                      r3.name("R3").publicId("urn:resource:3").qualityEvaluation(Grade.One)
                    }
              }
              .child(NodeType.TOPIC) { t2 -> t2.name("T2").publicId("urn:topic:2") }
        }

    parent.updateEntireAverageTree()

    // Clone resources
    val cloned1Id =
        TestUtils.getId(testUtils.createResource("/v1/nodes/urn:resource:1/clone", NodePostPut()))
    val cloned2Id =
        TestUtils.getId(testUtils.createResource("/v1/nodes/urn:resource:2/clone", NodePostPut()))
    val cloned3Id =
        TestUtils.getId(testUtils.createResource("/v1/nodes/urn:resource:3/clone", NodePostPut()))

    // Check that resources have cloned quality evaluation
    val cloned1 = nodeRepository.getByPublicId(cloned1Id)
    val cloned2 = nodeRepository.getByPublicId(cloned2Id)
    val cloned3 = nodeRepository.getByPublicId(cloned3Id)
    assertEquals(Grade.Five, cloned1.qualityEvaluationGrade)
    assertEquals(Grade.Four, cloned2.qualityEvaluationGrade)
    assertEquals(Grade.One, cloned3.qualityEvaluationGrade)

    run { // Connect cloned resources to urn:topic:2
      val connectBody1 = NodeConnectionPOST()
      connectBody1.parentId = URI.create("urn:topic:2")
      connectBody1.childId = cloned1Id

      val connectBody2 = NodeConnectionPOST()
      connectBody2.parentId = URI.create("urn:topic:2")
      connectBody2.childId = cloned2Id

      val connectBody3 = NodeConnectionPOST()
      connectBody3.parentId = URI.create("urn:topic:2")
      connectBody3.childId = cloned3Id

      testUtils.createResource("/v1/node-connections/", connectBody1)
      testUtils.createResource("/v1/node-connections/", connectBody2)
      testUtils.createResource("/v1/node-connections/", connectBody3)
    }

    val topic2 = nodeRepository.getByPublicId(URI.create("urn:topic:2"))
    assertEquals(3, topic2.childNodes.size)
    assertNotNull(topic2.childQualityEvaluationAverage)
    assertEquals(3, topic2.childQualityEvaluationAverage!!.count)
    assertEquals(3.3333333333333335, topic2.childQualityEvaluationAverage!!.averageValue)

    val subject1 = nodeRepository.getByPublicId(URI.create("urn:subject:1"))
    assertNotNull(subject1.childQualityEvaluationAverage)
    assertEquals(6, subject1.childQualityEvaluationAverage!!.count)
    assertEquals(3.3333333333333335, subject1.childQualityEvaluationAverage!!.averageValue)
  }

  @Test
  fun moving_a_topic_also_moves_the_quality_evaluation_calculation() {
    // Create structure with resources and quality evaluation
    val s1Node =
        builder.node(NodeType.SUBJECT) { s1 ->
          s1.name("S1").publicId("urn:subject:1").child(NodeType.TOPIC) { t1 ->
            t1.name("T1")
                .publicId("urn:topic:1")
                .child(NodeType.RESOURCE) { r1 ->
                  r1.name("R1").publicId("urn:resource:1").qualityEvaluation(Grade.Five)
                }
                .child(NodeType.RESOURCE) { r2 ->
                  r2.name("R2").publicId("urn:resource:2").qualityEvaluation(Grade.Four)
                }
                .child(NodeType.RESOURCE) { r3 ->
                  r3.name("R3").publicId("urn:resource:3").qualityEvaluation(Grade.One)
                }
          }
        }

    builder.node(NodeType.SUBJECT) { s2 -> s2.name("S2").publicId("urn:subject:2") }

    s1Node.updateEntireAverageTree()
    val topic1 = nodeRepository.getByPublicId(URI.create("urn:topic:1"))
    assertEquals(3, topic1.childNodes.size)
    topic1.updateEntireAverageTree()

    assertNotNull(topic1.childQualityEvaluationAverage)
    assertEquals(3, topic1.childQualityEvaluationAverage!!.count)
    assertEquals(3.3333333333333335, topic1.childQualityEvaluationAverage!!.averageValue)

    val subject1 = nodeRepository.getByPublicId(URI.create("urn:subject:1"))
    assertNotNull(subject1.childQualityEvaluationAverage)
    assertEquals(3, subject1.childQualityEvaluationAverage!!.count)
    assertEquals(3.3333333333333335, subject1.childQualityEvaluationAverage!!.averageValue)

    val subject2 = nodeRepository.getByPublicId(URI.create("urn:subject:2"))
    assertNull(subject2.childQualityEvaluationAverage)

    val topic = nodeRepository.getByPublicId(URI.create("urn:topic:1"))
    assertEquals(1, topic.getParentConnections().size)
    assertNotNull(topic.getParentConnections().firstOrNull())
    val connectionId = topic.getParentConnections().first().publicId

    testUtils.deleteResource("/v1/node-connections/$connectionId")

    val connectBody = NodeConnectionPOST()
    connectBody.parentId = URI.create("urn:subject:2")
    connectBody.childId = URI.create("urn:topic:1")

    testUtils.createResource("/v1/node-connections/", connectBody)

    assertEquals(3, topic1.childNodes.size)
    assertNotNull(topic1.childQualityEvaluationAverage)
    assertEquals(3, topic1.childQualityEvaluationAverage!!.count)
    assertEquals(3.3333333333333335, topic1.childQualityEvaluationAverage!!.averageValue)

    val s1 = nodeRepository.getByPublicId(URI.create("urn:subject:1"))
    assertNull(s1.childQualityEvaluationAverage)

    val s2 = nodeRepository.getByPublicId(URI.create("urn:subject:2"))
    assertNotNull(s2.childQualityEvaluationAverage)
    assertEquals(3, s2.childQualityEvaluationAverage!!.count)
    assertEquals(3.3333333333333335, s2.childQualityEvaluationAverage!!.averageValue)
  }

  fun connect(parent: Node, child: Node) {
    val connectBody = NodeConnectionPOST()
    connectBody.parentId = parent.publicId
    connectBody.childId = child.publicId

    testUtils.createResource("/v1/node-connections/", connectBody)
  }

  fun connectId(parentId: URI, childId: URI) {
    val connectBody = NodeConnectionPOST()
    connectBody.parentId = parentId
    connectBody.childId = childId

    testUtils.createResource("/v1/node-connections/", connectBody)
  }

  fun disconnect(parent: Node, child: Node) {
    val connection = nodeConnectionRepository.findByParentIdAndChildId(parent.id, child.id)
    val connectionId = connection!!.publicId
    testUtils.deleteResource("/v1/node-connections/$connectionId")
  }

  @Test
  fun that_adding_quality_evaluated_trees_works_recursively() {
    val s1 = builder.node(NodeType.SUBJECT) { s -> s.name("S1").publicId("urn:subject:1") }

    val t1 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T1").publicId("urn:topic:1").qualityEvaluation(Grade.Four)
        }
    val t2 = builder.node(NodeType.TOPIC) { n -> n.name("T2").qualityEvaluation(Grade.One) }
    val t3 = builder.node(NodeType.TOPIC) { n -> n.name("T3").qualityEvaluation(Grade.Two) }
    val t4 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T4").publicId("urn:topic:4").qualityEvaluation(Grade.One)
        }

    val r1 = builder.node(NodeType.RESOURCE) { n -> n.name("R1").qualityEvaluation(Grade.Five) }
    val r2 = builder.node(NodeType.RESOURCE) { n -> n.name("R2").qualityEvaluation(Grade.Five) }
    val r3 = builder.node(NodeType.RESOURCE) { n -> n.name("R3").qualityEvaluation(Grade.Three) }
    val r4 = builder.node(NodeType.RESOURCE) { n -> n.name("R4").qualityEvaluation(Grade.Four) }
    val r5 = builder.node(NodeType.RESOURCE) { n -> n.name("R5").qualityEvaluation(Grade.One) }
    val r6 = builder.node(NodeType.RESOURCE) { n -> n.name("R6").qualityEvaluation(Grade.Five) }
    val r7 = builder.node(NodeType.RESOURCE) { n -> n.name("R7").qualityEvaluation(Grade.Five) }
    val r8 = builder.node(NodeType.RESOURCE) { n -> n.name("R8").qualityEvaluation(Grade.Four) }
    val r9 = builder.node(NodeType.RESOURCE) { n -> n.name("R9").qualityEvaluation(Grade.Four) }
    val r10 = builder.node(NodeType.RESOURCE) { n -> n.name("R10").qualityEvaluation(Grade.Five) }
    val r11 = builder.node(NodeType.RESOURCE) { n -> n.name("R11").qualityEvaluation(Grade.Three) }
    val r12 = builder.node(NodeType.RESOURCE) { n -> n.name("R12").qualityEvaluation(Grade.Two) }
    val r13 = builder.node(NodeType.RESOURCE) { n -> n.name("R13").qualityEvaluation(Grade.Five) }
    val r14 = builder.node(NodeType.RESOURCE) { n -> n.name("R14").qualityEvaluation(Grade.One) }
    val r15 = builder.node(NodeType.RESOURCE) { n -> n.name("R15").qualityEvaluation(Grade.Four) }
    val r16 = builder.node(NodeType.RESOURCE) { n -> n.name("R16").qualityEvaluation(Grade.Four) }

    connect(s1, t1)
    connect(t1, t2)
    connect(t2, t3)

    connect(t1, r1)
    connect(t1, r2)
    connect(t1, r3)
    connect(t1, r4)

    connect(t2, r5)
    connect(t2, r6)
    connect(t2, r7)
    connect(t2, r8)

    connect(t3, r9)
    connect(t3, r10)
    connect(t3, r11)
    connect(t3, r12)

    connect(t4, r13)
    connect(t4, r14)
    connect(t4, r15)
    connect(t4, r16)

    connect(t1, t4)

    testQualityEvaluationAverage(s1, 16, 3.75)
    testQualityEvaluationAverage(t1, 16, 3.75)
    testQualityEvaluationAverage(t2, 8, 3.625)
    testQualityEvaluationAverage(t3, 4, 3.5)
    testQualityEvaluationAverage(t4, 4, 3.5)

    disconnect(t1, t4)

    testQualityEvaluationAverage(s1, 12, 3.8333333333333335)
    testQualityEvaluationAverage(t1, 12, 3.8333333333333335)
  }

  @Test
  fun that_deleting_a_bunch_of_quality_evaluation_works_as_expected() {
    val s1 = builder.node(NodeType.SUBJECT) { s -> s.name("S1").publicId("urn:subject:1") }

    val t1 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T1").publicId("urn:topic:1").qualityEvaluation(Grade.Four)
        }
    val t2 = builder.node(NodeType.TOPIC) { n -> n.name("T2").qualityEvaluation(Grade.One) }

    val r1 = builder.node(NodeType.RESOURCE) { n -> n.name("R1").qualityEvaluation(Grade.Five) }
    val r2 = builder.node(NodeType.RESOURCE) { n -> n.name("R2").qualityEvaluation(Grade.Five) }
    val r3 = builder.node(NodeType.RESOURCE) { n -> n.name("R3").qualityEvaluation(Grade.Three) }
    val r4 = builder.node(NodeType.RESOURCE) { n -> n.name("R4").qualityEvaluation(Grade.Four) }
    val r5 = builder.node(NodeType.RESOURCE) { n -> n.name("R5").qualityEvaluation(Grade.One) }
    val r6 = builder.node(NodeType.RESOURCE) { n -> n.name("R6").qualityEvaluation(Grade.Five) }
    val r7 = builder.node(NodeType.RESOURCE) { n -> n.name("R7").qualityEvaluation(Grade.Five) }
    val r8 = builder.node(NodeType.RESOURCE) { n -> n.name("R8").qualityEvaluation(Grade.Four) }

    connect(s1, t1)
    connect(t1, t2)

    connect(t1, r1)
    connect(t1, r2)
    connect(t1, r3)
    connect(t1, r4)

    testQualityEvaluationAverage(t1, 4, 4.25)

    disconnect(t1, t2)

    run {
      val node = nodeRepository.findFirstByPublicId(t2.publicId)
      val qe = node!!.childQualityEvaluationAverage
      assertNull(qe)
    }

    connect(t2, r5)
    connect(t2, r6)
    connect(t2, r7)
    connect(t2, r8)

    testQualityEvaluationAverage(t2, 4, 3.75)
    testQualityEvaluationAverage(t1, 4, 4.25)

    disconnect(s1, t1)
    connect(t1, t2)

    testQualityEvaluationAverage(t1, 8, 4.0)

    connect(s1, t1)

    testQualityEvaluationAverage(s1, 8, 4.0)
  }

  @Test
  fun that_updating_after_quality_evaluation_works_as_expected() {
    val s1 = builder.node(NodeType.SUBJECT) { s -> s.name("S1").publicId("urn:subject:1") }
    val t1 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T1").publicId("urn:topic:1").qualityEvaluation(Grade.Four)
        }
    val r1 = builder.node(NodeType.RESOURCE) { n -> n.name("R1").qualityEvaluation(Grade.Three) }

    connect(s1, t1)
    connect(t1, r1)

    testQualityEvaluationAverage(s1, 1, 3.0)
    testQualityEvaluationAverage(t1, 1, 3.0)

    val updateBody = NodePostPut()
    updateBody.name = "Resource 1"
    testUtils.updateResource("/v1/nodes/${r1.publicId}", updateBody)

    testQualityEvaluationAverage(s1, 1, 3.0)
    testQualityEvaluationAverage(t1, 1, 3.0)
  }

  fun createNode(name: String, nodeType: NodeType, qualityEvaluation: Int?): URI {
    val n = NodePostPut()
    n.name = name
    n.nodeType = nodeType
    qualityEvaluation?.let { x ->
      val comment = "La til karakter $x her da..."
      val qe = QualityEvaluationDTO(Grade.fromInt(x), comment)
      n.qualityEvaluation = UpdateOrDelete.Update(qe)
    }

    return TestUtils.getId(testUtils.createResource("/v1/nodes", n))
  }

  fun getQualityEvaluationGradesOf(ids: List<URI>): List<Int> =
      ids.map { id -> nodeRepository.getByPublicId(id).qualityEvaluationGrade!!.toInt() }

  fun getQEAverageGradesOf(ids: List<URI>): List<GradeAverage?> =
      ids.map { id -> nodeRepository.getByPublicId(id).childQualityEvaluationAverage }

  @Test
  fun update_super_nested_quality_evaluation() {
    // Create subjects
    val s1id = createNode("S1", NodeType.SUBJECT, 5)
    val s2id = createNode("S2", NodeType.SUBJECT, 4)
    val s3id = createNode("S3", NodeType.SUBJECT, 3)

    // Create topics
    val t1id = createNode("S1T1", NodeType.TOPIC, 5)
    val t2id = createNode("S1T2", NodeType.TOPIC, 5)
    val t3id = createNode("S2T3", NodeType.TOPIC, 5)
    val t4id = createNode("S1T1T4", NodeType.TOPIC, 2)
    val t5id = createNode("S1T1T5", NodeType.TOPIC, 3)
    val t6id = createNode("S1T2T6", NodeType.TOPIC, 4)
    val t7id = createNode("S1T4T7", NodeType.TOPIC, 3)
    val t8id = createNode("S1T4T8", NodeType.TOPIC, 2)
    val t9id = createNode("S1T6T9", NodeType.TOPIC, 3)
    val t10id = createNode("S1T5T10", NodeType.TOPIC, 2)
    val t11id = createNode("S1T4T7T11", NodeType.TOPIC, 5)
    val t12id = createNode("S1T4T7T12", NodeType.TOPIC, 4)

    // Hook topics to subjects
    connectId(s1id, t1id)
    connectId(s1id, t2id)
    connectId(s2id, t3id)
    connectId(t1id, t4id)
    connectId(t1id, t5id)
    connectId(t2id, t6id)
    connectId(t4id, t7id)
    connectId(t4id, t8id)
    connectId(t6id, t9id)
    connectId(t5id, t10id)
    connectId(t7id, t11id)
    connectId(t7id, t12id)

    // Create resources
    val r1id = createNode("S1T1R1", NodeType.RESOURCE, 5)
    val r2id = createNode("S1T1R2", NodeType.RESOURCE, 4)
    val r3id = createNode("S1T2R3", NodeType.RESOURCE, 3)
    val r4id = createNode("S1T2T6R4", NodeType.RESOURCE, 5)
    val r5id = createNode("S2T3R5", NodeType.RESOURCE, 4)
    val r6id = createNode("S1T1T4R6", NodeType.RESOURCE, 2)
    val r7id = createNode("S1T6R7", NodeType.RESOURCE, 2)
    val r8id = createNode("S1T4T7R8", NodeType.RESOURCE, 3)
    val r9id = createNode("S1T4T7R9", NodeType.RESOURCE, 1)
    val r10id = createNode("S1T4T8R10", NodeType.RESOURCE, 1)
    val r11id = createNode("S1T5T10R11", NodeType.RESOURCE, 4)
    val r12id = createNode("S1T5T10R12", NodeType.RESOURCE, 2)
    val r13id = createNode("S1T5T10R13", NodeType.RESOURCE, 3)
    val r14id = createNode("S1T5T10R14", NodeType.RESOURCE, 5)
    val r15id = createNode("S1T4T7T11R15", NodeType.RESOURCE, 1)
    val r16id = createNode("S1T4T7T11R16", NodeType.RESOURCE, 2)
    val r17id = createNode("S1T4T7T11R17", NodeType.RESOURCE, 3)
    val r18id = createNode("S1T4T7T11R18", NodeType.RESOURCE, 2)
    val r19id = createNode("S1T4T7T12R19", NodeType.RESOURCE, 4)
    val r20id = createNode("S1T4T7T12R20", NodeType.RESOURCE, 1)

    // Hook resources to topics
    connectId(t1id, r1id)
    connectId(t1id, r2id)
    connectId(t2id, r3id)
    connectId(t6id, r4id)
    connectId(t3id, r5id)
    connectId(t4id, r6id)
    connectId(t6id, r7id)
    connectId(t7id, r8id)
    connectId(t7id, r9id)
    connectId(t8id, r10id)
    connectId(t10id, r11id)
    connectId(t10id, r12id)
    connectId(t10id, r13id)
    connectId(t10id, r14id)
    connectId(t11id, r15id)
    connectId(t11id, r16id)
    connectId(t11id, r17id)
    connectId(t11id, r18id)
    connectId(t12id, r19id)
    connectId(t12id, r20id)

    val allIds =
        listOf(
            s1id,
            s2id,
            s3id,
            t1id,
            t2id,
            t3id,
            t4id,
            t5id,
            t6id,
            t7id,
            t8id,
            t9id,
            t10id,
            t11id,
            t12id,
            r1id,
            r2id,
            r3id,
            r4id,
            r5id,
            r6id,
            r7id,
            r8id,
            r9id,
            r10id,
            r11id,
            r12id,
            r13id,
            r14id,
            r15id,
            r16id,
            r17id,
            r18id,
            r19id,
            r20id,
        )

    val originalGrades = getQualityEvaluationGradesOf(allIds)
    val originalAvgs = getQEAverageGradesOf(allIds)

    testUtils.createResource("/v1/admin/buildAverageTree")
    nodeRepository.flush()
    TestTransaction.flagForCommit()
    TestTransaction.end()
    TestTransaction.start()

    val originalAfterRebuild = getQualityEvaluationGradesOf(allIds)
    val originalAvgsAfterRebuild = getQEAverageGradesOf(allIds)
    assertEquals(originalAfterRebuild, originalGrades)
    assertEquals(originalAvgsAfterRebuild, originalAvgs)

    // Update all quality evaluations
    val updateBody = NodePostPut()
    updateBody.qualityEvaluation = UpdateOrDelete.Update(getRandomGrade())
    for (id in allIds) {
      testUtils.updateResource("/v1/nodes/$id", updateBody)
    }

    val updatedGrades = getQualityEvaluationGradesOf(allIds)
    val updatedAvgs = getQEAverageGradesOf(allIds)

    testUtils.createResource("/v1/admin/buildAverageTree")
    nodeRepository.flush()
    TestTransaction.flagForCommit()
    TestTransaction.end()
    TestTransaction.start()

    val updatedAfterRebuild = getQualityEvaluationGradesOf(allIds)
    val updatedAvgsAfterRebuild = getQEAverageGradesOf(allIds)
    assertEquals(updatedGrades, updatedAfterRebuild)
    assertEquals(updatedAvgs, updatedAvgsAfterRebuild)
  }

  @Test
  fun that_moving_quality_evaluated_trees_works_recursively() {
    val s1 = builder.node(NodeType.SUBJECT) { s -> s.name("S1").publicId("urn:subject:1") }

    val t1 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T1").publicId("urn:topic:1").qualityEvaluation(Grade.Four)
        }
    val t2 = builder.node(NodeType.TOPIC) { n -> n.name("T2").qualityEvaluation(Grade.One) }
    val t3 = builder.node(NodeType.TOPIC) { n -> n.name("T3").qualityEvaluation(Grade.Two) }
    val t4 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T4").publicId("urn:topic:4").qualityEvaluation(Grade.One)
        }

    val s2 = builder.node(NodeType.SUBJECT) { s -> s.name("S2").publicId("urn:subject:2") }
    val t5 = builder.node(NodeType.TOPIC) { n -> n.name("T5").qualityEvaluation(Grade.Two) }

    val r1 = builder.node(NodeType.RESOURCE) { n -> n.name("R1").qualityEvaluation(Grade.Five) }
    val r2 = builder.node(NodeType.RESOURCE) { n -> n.name("R2").qualityEvaluation(Grade.Five) }
    val r3 = builder.node(NodeType.RESOURCE) { n -> n.name("R3").qualityEvaluation(Grade.Three) }
    val r4 = builder.node(NodeType.RESOURCE) { n -> n.name("R4").qualityEvaluation(Grade.Four) }
    val r5 = builder.node(NodeType.RESOURCE) { n -> n.name("R5").qualityEvaluation(Grade.One) }
    val r6 = builder.node(NodeType.RESOURCE) { n -> n.name("R6").qualityEvaluation(Grade.Five) }
    val r7 = builder.node(NodeType.RESOURCE) { n -> n.name("R7").qualityEvaluation(Grade.Five) }
    val r8 = builder.node(NodeType.RESOURCE) { n -> n.name("R8").qualityEvaluation(Grade.Four) }
    val r9 = builder.node(NodeType.RESOURCE) { n -> n.name("R9").qualityEvaluation(Grade.Four) }
    val r10 = builder.node(NodeType.RESOURCE) { n -> n.name("R10").qualityEvaluation(Grade.Five) }
    val r11 = builder.node(NodeType.RESOURCE) { n -> n.name("R11").qualityEvaluation(Grade.Three) }
    val r12 = builder.node(NodeType.RESOURCE) { n -> n.name("R12").qualityEvaluation(Grade.Two) }
    val r13 = builder.node(NodeType.RESOURCE) { n -> n.name("R13").qualityEvaluation(Grade.Five) }
    val r14 = builder.node(NodeType.RESOURCE) { n -> n.name("R14").qualityEvaluation(Grade.One) }
    val r15 = builder.node(NodeType.RESOURCE) { n -> n.name("R15").qualityEvaluation(Grade.Four) }
    val r16 = builder.node(NodeType.RESOURCE) { n -> n.name("R16").qualityEvaluation(Grade.Four) }
    val r17 = builder.node(NodeType.RESOURCE) { n -> n.name("R17").qualityEvaluation(Grade.Three) }
    val r18 = builder.node(NodeType.RESOURCE) { n -> n.name("R18").qualityEvaluation(Grade.Two) }

    connect(s1, t1)
    connect(t1, t2)
    connect(t2, t3)

    connect(t1, r1)
    connect(t1, r2)
    connect(t1, r3)
    connect(t1, r4)

    connect(t2, r5)
    connect(t2, r6)
    connect(t2, r7)
    connect(t2, r8)

    connect(t3, r9)
    connect(t3, r10)
    connect(t3, r11)
    connect(t3, r12)

    connect(t4, r13)
    connect(t4, r14)
    connect(t4, r15)
    connect(t4, r16)

    connect(t1, t4)

    connect(t5, r17)
    connect(t5, r18)
    connect(s2, t5)

    testQualityEvaluationAverage(s1, 16, 3.75)
    testQualityEvaluationAverage(t1, 16, 3.75)
    testQualityEvaluationAverage(t2, 8, 3.625)
    testQualityEvaluationAverage(t3, 4, 3.5)
    testQualityEvaluationAverage(t4, 4, 3.5)

    disconnect(t1, t4)

    testQualityEvaluationAverage(t5, 2, 2.5)
    testQualityEvaluationAverage(s2, 2, 2.5)
    connect(t5, t4)

    testQualityEvaluationAverage(s2, 6, 3.1666666666666665)

    disconnect(t5, t4)
    testQualityEvaluationAverage(s2, 2, 2.5)

    connect(t1, t4)
    testQualityEvaluationAverage(s1, 16, 3.75)
    testQualityEvaluationAverage(t1, 16, 3.75)
    testQualityEvaluationAverage(t2, 8, 3.625)
    testQualityEvaluationAverage(t3, 4, 3.5)
    testQualityEvaluationAverage(t4, 4, 3.5)
  }

  @Test
  fun that_reusing_resources_and_updating_them_works_everywhere() {
    val s1 = builder.node(NodeType.SUBJECT) { s -> s.name("S1").publicId("urn:subject:1") }

    val t1 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T1").publicId("urn:topic:1").qualityEvaluation(Grade.Four)
        }
    val t2 = builder.node(NodeType.TOPIC) { n -> n.name("T2").qualityEvaluation(Grade.One) }
    val t3 = builder.node(NodeType.TOPIC) { n -> n.name("T3").qualityEvaluation(Grade.Two) }
    val t4 =
        builder.node(NodeType.TOPIC) { n ->
          n.name("T4").publicId("urn:topic:4").qualityEvaluation(Grade.One)
        }

    val s2 = builder.node(NodeType.SUBJECT) { s -> s.name("S2").publicId("urn:subject:2") }
    val t5 = builder.node(NodeType.TOPIC) { n -> n.name("T5").qualityEvaluation(Grade.Two) }

    val r1 = builder.node(NodeType.RESOURCE) { n -> n.name("R1").qualityEvaluation(Grade.Five) }
    val r2 = builder.node(NodeType.RESOURCE) { n -> n.name("R2").qualityEvaluation(Grade.Five) }
    val r3 = builder.node(NodeType.RESOURCE) { n -> n.name("R3").qualityEvaluation(Grade.Three) }
    val r4 = builder.node(NodeType.RESOURCE) { n -> n.name("R4").qualityEvaluation(Grade.Four) }
    val r5 = builder.node(NodeType.RESOURCE) { n -> n.name("R5").qualityEvaluation(Grade.One) }
    val r6 = builder.node(NodeType.RESOURCE) { n -> n.name("R6").qualityEvaluation(Grade.Five) }
    val r7 = builder.node(NodeType.RESOURCE) { n -> n.name("R7").qualityEvaluation(Grade.Five) }
    val r8 = builder.node(NodeType.RESOURCE) { n -> n.name("R8").qualityEvaluation(Grade.Four) }
    val r9 = builder.node(NodeType.RESOURCE) { n -> n.name("R9").qualityEvaluation(Grade.Four) }
    val r10 = builder.node(NodeType.RESOURCE) { n -> n.name("R10").qualityEvaluation(Grade.Five) }
    val r11 = builder.node(NodeType.RESOURCE) { n -> n.name("R11").qualityEvaluation(Grade.Three) }
    val r12 = builder.node(NodeType.RESOURCE) { n -> n.name("R12").qualityEvaluation(Grade.Two) }
    val r13 = builder.node(NodeType.RESOURCE) { n -> n.name("R13").qualityEvaluation(Grade.Five) }
    val r14 = builder.node(NodeType.RESOURCE) { n -> n.name("R14").qualityEvaluation(Grade.One) }
    val r15 = builder.node(NodeType.RESOURCE) { n -> n.name("R15").qualityEvaluation(Grade.Four) }
    val r16 = builder.node(NodeType.RESOURCE) { n -> n.name("R16").qualityEvaluation(Grade.Four) }

    connect(s1, t1)
    connect(t1, t2)
    connect(t2, t3)

    connect(t1, r1)
    connect(t1, r2)
    connect(t1, r3)
    connect(t1, r4)

    connect(t2, r5)
    connect(t2, r6)
    connect(t2, r7)
    connect(t2, r8)

    connect(t3, r9)
    connect(t3, r10)
    connect(t3, r11)
    connect(t3, r12)

    connect(t4, r13)
    connect(t4, r14)
    connect(t4, r15)
    connect(t4, r16)

    connect(t1, t4)

    connect(t5, r9)
    connect(t5, r10)
    connect(t5, r11)
    connect(t5, r12)
    connect(s2, t5)

    testQualityEvaluationAverage(s1, 16, 3.75)
    testQualityEvaluationAverage(t1, 16, 3.75)
    testQualityEvaluationAverage(t2, 8, 3.625)
    testQualityEvaluationAverage(t3, 4, 3.5)
    testQualityEvaluationAverage(t4, 4, 3.5)
    testQualityEvaluationAverage(t5, 4, 3.5)
    testQualityEvaluationAverage(s2, 4, 3.5)

    run {
      val updater12 = NodePostPut()
      val qe12 = QualityEvaluationDTO(Grade.fromInt(5), "Hei")
      updater12.qualityEvaluation = UpdateOrDelete.Update(qe12)
      testUtils.updateResource("/v1/nodes/${r12.publicId}", updater12)
    }

    testQualityEvaluationAverage(t3, 4, 4.25)
    testQualityEvaluationAverage(t5, 4, 4.25)
    testQualityEvaluationAverage(s2, 4, 4.25)
    testQualityEvaluationAverage(t2, 8, 4.0)
    testQualityEvaluationAverage(t1, 16, 3.9375)
    testQualityEvaluationAverage(s1, 16, 3.9375)
  }

  fun getRandomGrade(): QualityEvaluationDTO {
    val x = Random().nextInt(5) + 1
    return QualityEvaluationDTO(Grade.fromInt(x), "Random grade $x")
  }

  @Test
  fun requires_technical_evaluation_defaults_to_empty() {
    val node = builder.node(NodeType.TOPIC)
    val id = node.publicId

    val found = nodeRepository.getByPublicId(id)
    assertNull(found.requiresTechnicalEvaluation)
    assertNull(found.technicalEvaluationComment)
  }

  @Test
  fun that_updating_requires_technical_evaluation_to_false_removes_comment() {
    val command =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          technicalEvaluation = UpdateOrDelete.Update(TechnicalEvaluationDTO(true, "Needs review"))
        }
    val id = TestUtils.getId(testUtils.createResource("/v1/nodes", command))

    val found = nodeRepository.getByPublicId(id)
    assertTrue(found.requiresTechnicalEvaluation!!)
    assertEquals("Needs review", found.technicalEvaluationComment)

    val command2 =
        NodePostPut().apply {
          technicalEvaluation = UpdateOrDelete.Update(TechnicalEvaluationDTO(false, "Needs review"))
        }
    testUtils.updateResource("/v1/nodes/$id", command2)
    val found2 = nodeRepository.getByPublicId(id)
    assertFalse(found2.requiresTechnicalEvaluation!!)
    assertNull(found2.technicalEvaluationComment)
  }

  @Test
  fun that_technical_evluation_comment_can_be_updated() {
    val command =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          technicalEvaluation = UpdateOrDelete.Update(TechnicalEvaluationDTO(true, null))
        }
    val id = TestUtils.getId(testUtils.createResource("/v1/nodes", command))

    val found = nodeRepository.getByPublicId(id)
    assertTrue(found.requiresTechnicalEvaluation!!)
    assertNull(found.technicalEvaluationComment)

    val command2 =
        NodePostPut().apply {
          technicalEvaluation = UpdateOrDelete.Update(TechnicalEvaluationDTO(true, "Needs review"))
        }
    testUtils.updateResource("/v1/nodes/$id", command2)

    val found2 = nodeRepository.getByPublicId(id)
    assertTrue(found2.requiresTechnicalEvaluation!!)
    assertEquals("Needs review", found2.technicalEvaluationComment)
  }

  @Test
  fun that_comment_cannot_be_set_without_requiring_technical_evaluation() {
    val command =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          technicalEvaluation = UpdateOrDelete.Update(TechnicalEvaluationDTO(false, "Needs review"))
        }
    val id = TestUtils.getId(testUtils.createResource("/v1/nodes", command))

    val found = nodeRepository.getByPublicId(id)
    assertFalse(found.requiresTechnicalEvaluation!!)
    assertNull(found.technicalEvaluationComment)
  }

  @Test
  fun that_technical_evaluation_is_included_in_node_response() {
    val command =
        NodePostPut().apply {
          nodeType = NodeType.TOPIC
          technicalEvaluation = UpdateOrDelete.Update(TechnicalEvaluationDTO(true, "Needs review"))
        }
    val id = TestUtils.getId(testUtils.createResource("/v1/nodes", command))

    val response = testUtils.getResource("/v1/nodes/$id")

    val nodeDTO = testUtils.getObject(NodeDTO::class.java, response)
    val te = nodeDTO.technicalEvaluation!!
    assertTrue(te.requiresEvaluation)
    assertEquals("Needs review", te.comment)
  }

  fun testQualityEvaluationAverage(inputNode: Node, expectedCount: Int, expectedAverage: Double) {
    val node = nodeRepository.findFirstByPublicId(inputNode.publicId)!!
    val qe = node.childQualityEvaluationAverage!!
    assertEquals(expectedCount, qe.count)
    assertEquals(expectedAverage, qe.averageValue)
  }

  private class ConnectionTypeCounter(private val connections: Array<ConnectionDTO>) {
    var subjectCount = 0
      private set

    var parentCount = 0
      private set

    var childCount = 0
      private set

    fun countTypes(): ConnectionTypeCounter {
      subjectCount = 0
      parentCount = 0
      childCount = 0
      for (connection in connections) {
        when (connection.type) {
          "parent-subject" -> subjectCount++
          "parent" -> parentCount++
          "child" -> childCount++
          else -> fail("Unexpected connection type :${connection.type}")
        }
      }
      return this
    }
  }
}
