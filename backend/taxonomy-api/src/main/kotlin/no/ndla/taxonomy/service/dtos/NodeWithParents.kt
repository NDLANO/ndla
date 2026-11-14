/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.dtos

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.exceptions.NotFoundException

@Schema(name = "NodeWithParents", requiredProperties = ["parents"])
class NodeWithParents : NodeDTO {
  @field:JsonProperty
  @field:Schema(
      description = "Parent topology nodes and whether or not connection type is primary",
      example =
          "[" +
              "{\"id\": \"urn:topic:1:181900\"," +
              "\"name\": \"I dyrehagen\"," +
              "\"contentUri\": \"urn:article:6662\"," +
              "\"path\": \"/subject:2/topic:1:181900\"," +
              "\"primary\": \"true\"}]",
  )
  val parents: MutableSet<NodeChildDTO> = mutableSetOf()

  @JsonCreator constructor() : super()

  constructor(
      node: Node,
      languageCode: String,
      includeContexts: Boolean,
  ) : super(
      entity = node,
      languageCode = languageCode,
      includeContexts = includeContexts,
      filterProgrammes = false,
      isVisible = true,
  ) {
    node.getParentConnections().mapTo(parents) { nodeResource ->
      val parent = nodeResource.parent ?: throw NotFoundException("Parent not found")
      NodeChildDTO(parent, nodeResource, languageCode)
    }
  }
}
