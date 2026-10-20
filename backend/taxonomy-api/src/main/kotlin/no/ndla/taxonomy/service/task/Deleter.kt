/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.task

import no.ndla.taxonomy.domain.DomainEntity
import no.ndla.taxonomy.service.NodeConnectionService

class Deleter : Task<DomainEntity>() {
  private lateinit var nodeConnectionService: NodeConnectionService

  fun setNodeConnectionService(nodeService: NodeConnectionService) {
    this.nodeConnectionService = nodeService
  }

  override fun execute(): DomainEntity? = nodeConnectionService.disconnectAllInvisibleNodes()
}
