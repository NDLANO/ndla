/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.dtos

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import java.net.URI
import no.ndla.taxonomy.domain.NodeConnection

/**  */
@Schema(
    name = "Connection",
    requiredProperties = ["connectionId", "targetId", "paths", "type", "isPrimary"],
)
class ConnectionDTO() {

  @field:JsonProperty
  @field:Schema(
      description = "The id of the subject-topic or topic-subtopic connection",
      example = "urn:subject-topic:1",
  )
  lateinit var connectionId: URI
    private set

  @field:JsonProperty
  @field:Schema(description = "The id of the connected subject or topic", example = "urn:subject:1")
  var targetId: URI? = null
    private set

  @field:JsonProperty
  @field:Schema(
      description = "The path part of the url for the subject or subtopic connected to this topic",
      example = "/subject:1/topic:1",
      deprecated = true,
  )
  var paths: Set<String> = HashSet()
    private set

  @field:JsonProperty
  @field:Schema(description = "The type of connection (parent, child, referrer or target")
  lateinit var type: String
    private set

  @field:JsonProperty("isPrimary")
  @field:Schema(
      description = "True if owned by this topic, false if it has its primary connection elsewhere",
      example = "true",
      deprecated = true,
  )
  @get:JsonProperty("isPrimary")
  var isPrimary: Boolean = false
    private set

  private constructor(connection: NodeConnection, isParentConnection: Boolean) : this() {
    this.connectionId = connection.publicId
    this.isPrimary = connection.isPrimary

    val connectedObject = if (isParentConnection) connection.parent else connection.child

    connectedObject?.let { connected ->
      this.targetId = connected.publicId
      this.paths = setOf()
    }
    this.type =
        if (isParentConnection) connection.connectionType.from else connection.connectionType.to
  }

  companion object {
    fun parentConnection(connection: NodeConnection): ConnectionDTO =
        ConnectionDTO(connection, true)

    fun childConnection(connection: NodeConnection): ConnectionDTO =
        ConnectionDTO(connection, false)
  }
}
