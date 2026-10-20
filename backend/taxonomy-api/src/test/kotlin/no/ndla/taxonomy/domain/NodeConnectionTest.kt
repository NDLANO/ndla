/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify

class NodeConnectionTest {
  private lateinit var parent: Node
  private lateinit var child: Node

  private lateinit var connection: NodeConnection

  @BeforeEach
  fun setUp() {
    parent = mock(Node::class.java)
    child = mock(Node::class.java)
    val core = mock(Relevance::class.java)

    connection = NodeConnection.create(parent, child, core)
    assertNotNull(connection.publicId)
  }

  @Test
  fun getParent() {
    assertSame(parent, connection.parent)
  }

  @Test
  fun getChild() {
    assertSame(child, connection.child)
  }

  @Test
  fun getAndSetRank() {
    assertEquals(0, connection.rank)
    connection.rank = 10
    assertEquals(10, connection.rank)
  }

  @Test
  fun preRemove() {
    connection.preRemove()

    verify(parent).removeChildConnection(connection)
    verify(child).removeParentConnection(connection)
    assertNull(connection.parent)
    assertNull(connection.child)
  }
}
