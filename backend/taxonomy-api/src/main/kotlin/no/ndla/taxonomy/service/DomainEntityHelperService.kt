/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.domain.DomainEntity
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.service.exceptions.NotFoundServiceException
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Component
@Transactional(readOnly = true)
class DomainEntityHelperService(
    private val nodeRepository: NodeRepository,
    private val nodeConnectionRepository: NodeConnectionRepository,
) {
  @Transactional(propagation = Propagation.MANDATORY)
  fun getNodeByPublicId(publicId: URI): Node =
      nodeRepository.findFirstByPublicId(publicId)
          ?: throw NotFoundServiceException("Node", publicId)

  @Transactional(propagation = Propagation.MANDATORY)
  fun getEntityByPublicId(publicId: URI): DomainEntity? =
      when (publicId.schemeSpecificPart.split(":")[0]) {
        "subject",
        "topic",
        "node",
        "resource",
        "programme" -> nodeRepository.findFirstByPublicId(publicId)
        "node-connection",
        "subject-topic",
        "topic-subtopic",
        "node-resource",
        "topic-resource" -> nodeConnectionRepository.findByPublicId(publicId)
        else -> throw NotFoundServiceException("Entity of type not found")
      }
}
