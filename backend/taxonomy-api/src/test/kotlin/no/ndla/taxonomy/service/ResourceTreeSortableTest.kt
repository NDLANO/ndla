/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class ResourceTreeSortableTest {
  @Test
  fun getSortableRank() {

    // TopicResource
    var sortable =
        ResourceTreeSortable("resource", "topic", URI.create("100"), URI.create("10"), 1000)
    assertEquals(1000 - 10000, sortable.sortableRank)

    // TopicSubtopic
    sortable = ResourceTreeSortable("topic", "topic", URI.create("100"), URI.create("10"), 800)
    assertEquals(800 - 1000, sortable.sortableRank)
  }

  @Test
  fun getSortableId() {
    val sortable =
        ResourceTreeSortable("resource", "topic", URI.create("100"), URI.create("10"), 1000)
    assertEquals(URI("urn:resource:100"), sortable.sortableId)
  }

  @Test
  fun getSortableParentId() {
    val sortable =
        ResourceTreeSortable("resource", "topic", URI.create("100"), URI.create("10"), 1000)
    assertEquals(URI("urn:topic:10"), sortable.sortableParentId)
  }

  @Test
  fun getNodeResource() {
    var sortable =
        ResourceTreeSortable("resource", "topic", URI.create("100"), URI.create("10"), 1000)
    assertNull(sortable.resourceConnection)

    val node = mock(Node::class.java)
    val resource = mock(Node::class.java)
    val nodeResource = mock(NodeConnection::class.java)

    `when`(node.id).thenReturn(101)
    `when`(resource.id).thenReturn(102)

    `when`(nodeResource.parent).thenReturn(node)
    `when`(nodeResource.resource).thenReturn(resource)

    `when`(nodeResource.rank).thenReturn(200 - 10000)

    sortable = ResourceTreeSortable(nodeResource)
    assertSame(nodeResource, sortable.resourceConnection)
  }

  @Test
  fun testPopulateFromNodeResource() {
    val node = mock(Node::class.java)
    val resource = mock(Node::class.java)
    val nodeResource = mock(NodeConnection::class.java)

    `when`(node.publicId).thenReturn(URI.create("101"))
    `when`(resource.publicId).thenReturn(URI.create("102"))

    `when`(nodeResource.parent).thenReturn(node)
    `when`(nodeResource.resource).thenReturn(resource)

    `when`(nodeResource.rank).thenReturn(200)

    val sortable = ResourceTreeSortable(nodeResource)

    assertEquals(200 - 10000, sortable.sortableRank)
    assertEquals(URI("urn:node:101"), sortable.sortableParentId)
    assertEquals(URI("urn:resource:102"), sortable.sortableId)
  }
}
