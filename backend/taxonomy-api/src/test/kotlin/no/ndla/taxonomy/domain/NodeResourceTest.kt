/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`

class NodeResourceTest {
  private lateinit var node: Node
  private lateinit var resource: Node
  private lateinit var resourceConnection: NodeConnection

  @BeforeEach
  fun setUp() {
    node = mock(Node::class.java)
    `when`(node.nodeType).thenReturn(NodeType.TOPIC)
    resource = mock(Node::class.java)
    `when`(resource.nodeType).thenReturn(NodeType.RESOURCE)
    val core = mock(Relevance::class.java)

    resourceConnection =
        NodeConnection.create(node, resource, core, NodeConnectionType.BRANCH, false)

    verify(node).addChildConnection(resourceConnection)
    verify(resource).addParentConnection(resourceConnection)

    assertNotNull(resourceConnection.publicId)
    assertTrue(resourceConnection.publicId.toString().length > 4)
  }

  @Test
  fun getNode() {
    assertSame(node, resourceConnection.parent)
  }

  @Test
  fun getResource() {
    assertSame(resource, resourceConnection.resource)
  }

  @Test
  fun setAndIsPrimary() {
    assertFalse(resourceConnection.isPrimary)
    resourceConnection.isPrimary = true
    assertTrue(resourceConnection.isPrimary)
    resourceConnection.isPrimary = false
    assertFalse(resourceConnection.isPrimary)
  }

  @Test
  fun setAndGetRank() {
    assertEquals(0, resourceConnection.rank)
    resourceConnection.rank = 100
    assertEquals(100, resourceConnection.rank)
  }

  @Test
  fun preRemove() {
    resourceConnection.preRemove()

    assertNull(resourceConnection.resource)
    assertNull(resourceConnection.parent)

    verify(node).removeChildConnection(resourceConnection)
    verify(resource).removeParentConnection(resourceConnection)
  }
}
