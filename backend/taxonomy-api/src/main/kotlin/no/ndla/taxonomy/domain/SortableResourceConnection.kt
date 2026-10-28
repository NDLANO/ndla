/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

interface SortableResourceConnection {
  val resource: Node?

  val parent: Node?

  val rank: Int
}
