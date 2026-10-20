/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import java.io.Serializable
import java.time.Instant
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp

@Entity
class CustomField() : Serializable {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Int? = null

  @UpdateTimestamp var updatedAt: Instant? = null

  @CreationTimestamp var createdAt: Instant? = null

  @Column var key: String? = null

  constructor(key: String?) : this() {
    this.key = key
  }

  constructor(customField: CustomField) : this() {
    this.key = customField.key
  }
}
