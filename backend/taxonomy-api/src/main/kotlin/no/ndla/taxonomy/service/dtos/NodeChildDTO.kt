/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.dtos

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import java.net.URI
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.exceptions.NotFoundException
import no.ndla.taxonomy.service.TreeSorter

/** Represents Node or Resource in child context */
@Schema(
    name = "NodeChild",
    requiredProperties =
        [
            "id",
            "baseName",
            "name",
            "nodeType",
            "metadata",
            "translations",
            "supportedLanguages",
            "breadcrumbs",
            "resourceTypes",
            "updatedAt",
            "contexts",
            "contextids",
            "language",
            "paths",
            "parentId",
            "connectionId",
            "isPrimary",
            "rank",
        ],
)
class NodeChildDTO : NodeDTO, TreeSorter.Sortable {

  @field:Schema(description = "Parent id in the current context, null if none exists")
  var parentId: URI? = null

  @field:Schema(
      description =
          "The id of the node connection which causes this node to be included in the result set.",
      example = "urn:node-connection:1",
  )
  lateinit var connectionId: URI

  @get:JsonProperty("isPrimary") @set:JsonProperty("isPrimary") var isPrimary: Boolean = false

  @field:Schema(
      description = "The order in which to sort the node within it's level.",
      example = "1",
  )
  var rank: Int = 0

  @field:Schema(
      description = "The type of connection (branch or link)",
      example = "BRANCH",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  lateinit var connectionType: NodeConnectionType
    private set

  constructor(
      root: Node?,
      nodeConnection: NodeConnection,
      language: String,
      includeContexts: Boolean,
      filterProgrammes: Boolean,
      isVisible: Boolean,
  ) : super(
      root,
      nodeConnection.parent,
      nodeConnection.child ?: throw NotFoundException("Child was not found"),
      nodeConnection.connectionType,
      language,
      null,
      includeContexts,
      filterProgrammes,
      isVisible,
      false,
  ) {
    // This must be enabled when ed is updated to update metadata for connections.
    // this.metadata = new MetadataDto(nodeConnection.getMetadata());

    nodeConnection.parent?.let { parent -> this.parentId = parent.publicId }

    this.rank = nodeConnection.rank
    this.connectionId = nodeConnection.publicId
    this.connectionType = nodeConnection.connectionType
    this.isPrimary = nodeConnection.isPrimary
    this.relevanceId = nodeConnection.relevance?.id
  }

  /*
   * Special constructor used to get parents for resource/full
   */
  constructor(
      parent: Node,
      nodeConnection: NodeConnection,
      language: String,
  ) : super(
      null,
      nodeConnection.parent,
      parent,
      nodeConnection.connectionType,
      language,
      null,
      false,
      false,
      true,
      false,
  ) {
    this.rank = nodeConnection.rank
    this.connectionId = nodeConnection.publicId
    this.connectionType = nodeConnection.connectionType
    this.isPrimary = nodeConnection.isPrimary
    this.relevanceId = nodeConnection.relevance?.id
  }

  @JsonIgnore
  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is NodeChildDTO) return false

    return id == other.id
  }

  constructor() : super()

  override val sortableRank: Int
    get() = rank

  override val sortableId: URI
    get() = id

  override val sortableParentId: URI?
    get() = parentId
}
