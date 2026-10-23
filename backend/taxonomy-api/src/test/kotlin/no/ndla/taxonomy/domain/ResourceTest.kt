/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import java.net.URI
import no.ndla.taxonomy.domain.exceptions.DuplicateIdException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.springframework.test.util.ReflectionTestUtils

class ResourceTest {
  private lateinit var resource: Node

  @BeforeEach
  fun setUp() {
    this.resource = Node(NodeType.RESOURCE)
  }

  @Test
  fun addAndGetAndRemoveTranslations() {
    assertEquals(0, resource.translations.size)

    val returnedTranslation = resource.addTranslation("hei", "nb")
    assertEquals(1, resource.translations.size)
    assertEquals("nb", returnedTranslation.languageCode)
    assertTrue(resource.translations.contains(returnedTranslation))
    assertEquals(resource, returnedTranslation.parent)

    val returnedTranslation2 = resource.addTranslation("hello", "en")
    assertEquals(2, resource.translations.size)
    assertEquals("en", returnedTranslation2.languageCode)
    assertTrue(resource.translations.containsAll(setOf(returnedTranslation, returnedTranslation2)))
    assertEquals(resource, returnedTranslation2.parent)

    resource.removeTranslation("nb")

    assertNull(returnedTranslation.parent)
    assertFalse(resource.translations.contains(returnedTranslation))

    assertFalse(resource.getTranslation("nb").isPresent)

    resource.addTranslation(returnedTranslation)
    assertEquals(resource, returnedTranslation.parent)
    assertTrue(resource.translations.contains(returnedTranslation))

    assertEquals(returnedTranslation, resource.getTranslation("nb").get())
    assertEquals(returnedTranslation2, resource.getTranslation("en").get())
  }

  @Test
  fun getAndSetName() {
    assertNull(resource.name)
    resource.name = "test name"
    assertEquals("test name", resource.name)
  }

  @Test
  fun getNodes() {
    val node1 = mock(Node::class.java)
    val node2 = mock(Node::class.java)

    assertEquals(0, resource.getParentConnections().size)

    val nodeResource1 = mock(NodeConnection::class.java)
    val nodeResource2 = mock(NodeConnection::class.java)

    `when`(nodeResource1.parent).thenReturn(node1)
    `when`(nodeResource2.parent).thenReturn(node2)

    ReflectionTestUtils.setField(resource, "parentConnections", setOf(nodeResource1, nodeResource2))

    assertEquals(2, resource.parentNodes.size)
    assertTrue(resource.parentNodes.containsAll(setOf(node1, node2)))
  }

  @Test
  fun getAddAndRemoveResourceTypes() {
    val resourceType1 = ResourceType.REVIEW_RESOURCE
    val resourceType2 = ResourceType.GAME

    assertEquals(0, resource.resourceTypes.size)

    resource.addResourceType(resourceType1)
    assertEquals(1, resource.resourceTypes.size)
    assertTrue(resource.resourceTypes.contains(resourceType1))
    resource.addResourceType(resourceType2)
    assertEquals(2, resource.resourceTypes.size)
    assertTrue(resource.resourceTypes.containsAll(setOf(resourceType1, resourceType2)))

    assertThrows<DuplicateIdException> { resource.addResourceType(resourceType2) }

    resource.removeResourceType(resourceType1)
    assertEquals(1, resource.resourceTypes.size)
    assertTrue(resource.resourceTypes.contains(resourceType2))
    resource.removeResourceType(resourceType2)
    assertEquals(0, resource.resourceTypes.size)
  }

  @Test
  fun setAndGetContentUri() {
    assertNull(resource.contentUri)

    val uri1 = URI("urn:test1")
    val uri2 = URI("urn:test2")

    resource.contentUri = uri1
    assertEquals("urn:test1", resource.contentUri.toString())

    resource.contentUri = uri2
    assertEquals("urn:test2", resource.contentUri.toString())
  }

  @Test
  fun addAndRemoveResourceType() {
    assertEquals(0, resource.resourceTypes.size)

    val resourceType1 = ResourceType.SUBJECT_MATERIAL
    resource.addResourceType(resourceType1)

    assertEquals(1, resource.resourceTypes.size)
    assertTrue(resource.resourceTypes.contains(resourceType1))

    val resourceType2 = ResourceType.TASKS_AND_ACTIVITIES
    resource.addResourceType(resourceType2)

    assertEquals(2, resource.resourceTypes.size)
    assertTrue(resource.resourceTypes.containsAll(setOf(resourceType1, resourceType2)))

    resource.removeResourceType(resourceType1)
    assertEquals(1, resource.resourceTypes.size)
    assertTrue(resource.resourceTypes.contains(resourceType2))

    resource.removeResourceType(resourceType2)
    assertEquals(0, resource.resourceTypes.size)
  }

  @Test
  fun addGetAndRemoveNodeResources() {
    val nodeResource1 = mock(NodeConnection::class.java)
    val nodeResource2 = mock(NodeConnection::class.java)

    assertEquals(0, resource.getParentConnections().size)

    assertThrows<IllegalArgumentException> { resource.addParentConnection(nodeResource1) }

    `when`(nodeResource1.child).thenReturn(resource)
    resource.addParentConnection(nodeResource1)

    assertEquals(1, resource.getParentConnections().size)
    assertTrue(resource.getParentConnections().contains(nodeResource1))

    assertThrows<IllegalArgumentException> { resource.addParentConnection(nodeResource2) }

    `when`(nodeResource2.child).thenReturn(resource)
    resource.addParentConnection(nodeResource2)

    assertEquals(2, resource.getParentConnections().size)
    assertTrue(resource.getParentConnections().containsAll(setOf(nodeResource1, nodeResource2)))

    `when`(nodeResource1.child).thenReturn(resource)
    `when`(nodeResource2.child).thenReturn(resource)

    resource.removeParentConnection(nodeResource1)

    verify(nodeResource1).disassociate()

    assertEquals(1, resource.getParentConnections().size)
    assertTrue(resource.getParentConnections().contains(nodeResource2))

    resource.removeParentConnection(nodeResource2)

    verify(nodeResource2).disassociate()
    assertEquals(0, resource.getParentConnections().size)
  }

  @Test
  fun preRemove() {
    val nodeResource1 = mock(NodeConnection::class.java)
    val nodeResource2 = mock(NodeConnection::class.java)

    setOf(nodeResource1, nodeResource2).forEach { nodeResource ->
      `when`(nodeResource.child).thenReturn(resource)
      resource.addParentConnection(nodeResource)
    }

    resource.preRemove()

    verify(nodeResource1).disassociate()
    verify(nodeResource2).disassociate()
  }

  @Test
  fun isContext() {
    val resource = Node(NodeType.RESOURCE)
    assertFalse(resource.isContext)
  }
}
