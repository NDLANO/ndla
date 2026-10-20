/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1.dtos

import io.swagger.v3.oas.annotations.media.Schema
import java.net.URI

class NodeConnectionPUT {
  @field:Schema(description = "If this connection is primary.", example = "true")
  var primary: Boolean? = null

  @field:Schema(description = "Order in which subtopic is sorted for the topic", example = "1")
  var rank: Int? = null

  @field:Schema(description = "Relevance id", example = "urn:relevance:core")
  var relevanceId: URI? = null
}
