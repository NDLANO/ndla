/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.task;

import no.ndla.taxonomy.domain.DomainEntity;
import no.ndla.taxonomy.service.NodeConnectionService;

public class Deleter extends Task<DomainEntity> {
    private NodeConnectionService nodeConnectionService;

    public void setNodeConnectionService(NodeConnectionService nodeService) {
        this.nodeConnectionService = nodeService;
    }

    @Override
    protected DomainEntity execute() {
        return nodeConnectionService.disconnectAllInvisibleNodes();
    }
}
