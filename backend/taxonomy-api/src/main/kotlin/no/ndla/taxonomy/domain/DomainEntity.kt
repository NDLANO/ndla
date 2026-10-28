/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import jakarta.persistence.Column
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import java.io.Serializable
import java.net.URI

@MappedSuperclass
class DomainEntity : Serializable {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Int? = null

  @Column lateinit var publicId: URI

  /**
   * Defaults to class name, but can be overrided
   *
   * @return entity name
   */
  val entityName: String
    get() = javaClass.simpleName.lowercase()
}
