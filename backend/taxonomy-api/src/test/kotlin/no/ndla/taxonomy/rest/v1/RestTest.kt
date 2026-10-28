/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.Builder
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.repositories.VersionRepository
import no.ndla.taxonomy.service.AbstractIntegrationTest
import no.ndla.taxonomy.service.ContextUpdaterService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

@ExtendWith(SpringExtension::class)
@SpringBootTest
@ActiveProfiles("junit")
@Transactional
abstract class RestTest : AbstractIntegrationTest() {

  @Autowired protected lateinit var versionRepository: VersionRepository

  @Autowired protected lateinit var nodeRepository: NodeRepository

  @Autowired protected lateinit var nodeConnectionRepository: NodeConnectionRepository

  @Autowired protected lateinit var testUtils: TestUtils

  @Autowired protected lateinit var contextUpdaterService: ContextUpdaterService

  protected lateinit var builder: Builder

  @BeforeEach
  fun restTestSetUp() {
    builder = Builder(entityManager, contextUpdaterService)
    nodeRepository.deleteAllAndFlush()
    nodeConnectionRepository.deleteAllAndFlush()
  }

  protected fun <T : Any> save(entity: T): T {
    entityManager.persist(entity)
    return entity
  }

  protected fun newSubject(): Node {
    val node = Node(NodeType.SUBJECT)
    node.isContext = true
    return save(node)
  }

  protected fun newTopic(): Node {
    val node = Node(NodeType.TOPIC)
    return save(node)
  }

  protected fun newResource(): Node {
    val node = Node(NodeType.RESOURCE)
    return save(node)
  }
}
