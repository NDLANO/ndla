/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1.dtos

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.net.URI
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.service.dtos.MetadataDTO

@Schema(
    name = "NodeConnection",
    requiredProperties =
        ["parentId", "childId", "id", "primary", "rank", "connectionType", "metadata"],
)
class NodeConnectionDTO private constructor() {
  @field:Schema(description = "Parent id", example = "urn:topic:234") var parentId: URI? = null

  @field:Schema(description = "Child id", example = "urn:topic:234") var childId: URI? = null

  @field:Schema(description = "Connection id", example = "urn:topic-has-subtopics:345")
  lateinit var id: URI

  @field:Schema(description = "Is this connection primary", example = "true")
  var primary: Boolean = false

  @field:Schema(description = "Order in which subtopic is sorted for the topic", example = "1")
  var rank: Int = 0

  @field:Schema(description = "Relevance id", example = "urn:relevance:core")
  var relevanceId: URI? = null

  @field:JsonProperty
  @field:Schema(description = "Metadata for entity. Read only.")
  private lateinit var metadata: MetadataDTO

  @field:Enumerated(EnumType.STRING)
  @field:Schema(description = "Connection type")
  lateinit var connectionType: NodeConnectionType

  constructor(nodeConnection: NodeConnection) : this() {
    id = nodeConnection.publicId
    nodeConnection.parent?.let { topic -> parentId = topic.publicId }
    nodeConnection.child?.let { subtopic -> childId = subtopic.publicId }
    relevanceId = nodeConnection.relevance?.id
    primary = true
    rank = nodeConnection.rank
    connectionType = nodeConnection.connectionType
    metadata = MetadataDTO(nodeConnection.metadata)
  }
}
