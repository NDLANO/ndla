/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.service.exceptions.NotFoundServiceException
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class DomainEntityHelperServiceTest : AbstractIntegrationTest() {
  private lateinit var subject1: Node
  private lateinit var subject2: Node
  private lateinit var topic1: Node
  private lateinit var topic2: Node
  private lateinit var node1: Node
  private lateinit var node2: Node
  private lateinit var resource1: Node
  private lateinit var resource2: Node

  private lateinit var service: DomainEntityHelperService

  @BeforeEach
  fun setUp(
      @Autowired nodeRepository: NodeRepository,
      @Autowired nodeConnectionRepository: NodeConnectionRepository,
  ) {
    service = DomainEntityHelperService(nodeRepository, nodeConnectionRepository)

    topic1 = Node(NodeType.TOPIC)
    topic1.publicId = URI.create("urn:topic:test:1")
    topic1 = nodeRepository.save(topic1)

    topic2 = Node(NodeType.TOPIC)
    topic2.publicId = URI.create("urn:topic:test:2")
    topic2 = nodeRepository.save(topic2)

    subject1 = Node(NodeType.SUBJECT)
    subject1.publicId = URI.create("urn:subject:test:1")
    subject1 = nodeRepository.save(subject1)

    subject2 = Node(NodeType.SUBJECT)
    subject2.publicId = URI.create("urn:subject:test:2")
    subject2 = nodeRepository.save(subject2)

    node1 = Node(NodeType.NODE)
    node1.publicId = URI.create("urn:node:test:1")
    node1 = nodeRepository.save(node1)

    node2 = Node(NodeType.NODE)
    node2.publicId = URI.create("urn:node:test:2")
    node2 = nodeRepository.save(node2)

    resource1 = Node(NodeType.RESOURCE)
    resource1.publicId = URI.create("urn:resource:test:1")
    resource1 = nodeRepository.save(resource1)

    resource2 = Node(NodeType.RESOURCE)
    resource2.publicId = URI.create("urn:resource:test:2")
    resource2 = nodeRepository.save(resource2)
  }

  @Test
  fun getSubjectByPublicId() {
    assertSame(subject1, service.getNodeByPublicId(URI.create("urn:subject:test:1")))
    assertSame(subject2, service.getNodeByPublicId(URI.create("urn:subject:test:2")))

    assertThrows<NotFoundServiceException> {
      service.getNodeByPublicId(URI.create("urn:topic:test:3"))
    }
  }

  @Test
  fun getTopicByPublicId() {
    assertSame(topic1, service.getNodeByPublicId(URI.create("urn:topic:test:1")))
    assertSame(topic2, service.getNodeByPublicId(URI.create("urn:topic:test:2")))

    assertThrows<NotFoundServiceException> {
      service.getNodeByPublicId(URI.create("urn:topic:test:3"))
    }
  }

  @Test
  fun getNodeByPublicId() {
    assertSame(node1, service.getNodeByPublicId(URI.create("urn:node:test:1")))
    assertSame(node2, service.getNodeByPublicId(URI.create("urn:node:test:2")))

    assertThrows<NotFoundServiceException> {
      service.getNodeByPublicId(URI.create("urn:node:test:3"))
    }
  }

  @Test
  fun getEntityByPublicId() {
    assertSame(subject1, service.getEntityByPublicId(URI.create("urn:subject:test:1")))
    assertSame(subject2, service.getEntityByPublicId(URI.create("urn:subject:test:2")))
    assertSame(topic1, service.getEntityByPublicId(URI.create("urn:topic:test:1")))
    assertSame(topic2, service.getEntityByPublicId(URI.create("urn:topic:test:2")))
    assertSame(node1, service.getEntityByPublicId(URI.create("urn:node:test:1")))
    assertSame(node2, service.getEntityByPublicId(URI.create("urn:node:test:2")))
    assertSame(resource1, service.getEntityByPublicId(URI.create("urn:resource:test:1")))
    assertSame(resource2, service.getEntityByPublicId(URI.create("urn:resource:test:2")))

    assertNull(service.getEntityByPublicId(URI.create("urn:topic:test:3")))
    assertNull(service.getEntityByPublicId(URI.create("urn:topic:test:3")))
    assertNull(service.getEntityByPublicId(URI.create("urn:node:test:3")))
    assertNull(service.getEntityByPublicId(URI.create("urn:resource:test:3")))
  }
}
