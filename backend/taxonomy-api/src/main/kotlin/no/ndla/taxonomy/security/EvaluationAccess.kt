/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import org.springframework.security.core.context.SecurityContextHolder

object EvaluationAccess {
  private val AUTHORITIES =
      setOf("TAXONOMY_WRITE", "TAXONOMY_ADMIN", "DRAFTS_WRITE", "DRAFTS_PUBLISH", "DRAFTS_ADMIN")

  fun canViewEvaluations(): Boolean =
      SecurityContextHolder.getContext().authentication?.authorities?.any {
        it.authority in AUTHORITIES
      } == true
}
