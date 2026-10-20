/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import java.net.URISyntaxException
import no.ndla.taxonomy.domain.SortableResourceConnection

class ResourceTreeSortable(
    private val type: String,
    private val parentType: String,
    private val id: URI?,
    private val parentId: URI?,
    private val rank: Int,
) : TreeSorter.Sortable {
  var resourceConnection: SortableResourceConnection? = null
    private set

  constructor(
      resourceConnection: SortableResourceConnection
  ) : this(
      type = "resource",
      parentType = "node",
      id =
          (resourceConnection.resource ?: throw IllegalArgumentException("Resource not set"))
              .publicId,
      parentId =
          (resourceConnection.parent ?: throw IllegalArgumentException("Parent not set")).publicId,
      rank = resourceConnection.rank,
  ) {
    this.resourceConnection = resourceConnection
  }

  override val sortableRank: Int
    get() {
      // Sort subject-topic relations first, then topic-resource, then topic-topic

      if ("resource" == type) {
        return rank - 10000
      }

      if ("topic" == type && "topic" == parentType) {
        return rank - 1000
      }

      if ("node" == type && "node" == parentType) {
        return rank - 1000
      }

      return rank
    }

  override val sortableId: URI
    get() =
        try {
          URI("urn:$type:$id")
        } catch (e: URISyntaxException) {
          throw IllegalArgumentException(e)
        }

  override val sortableParentId: URI
    get() =
        try {
          URI("urn:$parentType:$parentId")
        } catch (e: URISyntaxException) {
          throw IllegalArgumentException(e)
        }
}
