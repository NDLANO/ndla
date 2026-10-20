/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.task

import java.util.concurrent.Callable
import no.ndla.taxonomy.domain.DomainEntity
import no.ndla.taxonomy.service.VersionContext

abstract class Task<T : DomainEntity> : Callable<T?> {
  private lateinit var version: String

  fun setVersion(version: String) {
    this.version = version
  }

  final override fun call(): T? {
    VersionContext.setCurrentVersion(this.version)
    return execute()
  }

  protected abstract fun execute(): T?
}
