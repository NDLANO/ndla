/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1.dtos

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.net.URI
import no.ndla.taxonomy.domain.NodeConnectionType

@Schema(requiredProperties = ["parentId", "childId"])
class NodeConnectionPOST {
  @field:Schema(
      requiredMode = Schema.RequiredMode.REQUIRED,
      title = "Parent id",
      example = "urn:topic:234",
  )
  var parentId: URI? = null

  @field:Schema(
      requiredMode = Schema.RequiredMode.REQUIRED,
      description = "Child id",
      example = "urn:topic:234",
  )
  var childId: URI? = null

  @field:Schema(description = "If this connection is primary.", example = "true")
  var primary: Boolean? = true

  @field:Schema(description = "Order in which to sort the child for the parent", example = "1")
  var rank: Int? = null

  @field:Schema(description = "Relevance id", example = "urn:relevance:core")
  var relevanceId: URI? = null

  @field:Enumerated(EnumType.STRING)
  @field:Schema(description = "Connection type", example = "BRANCH", defaultValue = "BRANCH")
  var connectionType: NodeConnectionType? = null
}
