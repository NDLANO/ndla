/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import no.ndla.taxonomy.service.VersionContext
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.method.HandlerMethod
import org.springframework.web.servlet.AsyncHandlerInterceptor

/**
 * Restricts writes to versions other than the default schema to taxonomy admins. Must run after
 * VersionRequestInterceptor, which resolves the version for the request.
 */
@Profile("auth")
@Component
class VersionWriteInterceptor(
    @param:Value("\${spring.datasource.hikari.schema:taxonomy_api}")
    private val defaultSchema: String,
) : AsyncHandlerInterceptor {

  override fun preHandle(
      request: HttpServletRequest,
      response: HttpServletResponse,
      handler: Any,
  ): Boolean {
    if (request.method !in MUTATING_METHODS) return true
    if (handler !is HandlerMethod || !handler.hasMethodAnnotation(PreAuthorize::class.java)) {
      return true
    }
    if ((VersionContext.getCurrentVersion() ?: defaultSchema) == defaultSchema) return true

    val isAdmin =
        SecurityContextHolder.getContext().authentication?.authorities?.any {
          it.authority == "TAXONOMY_ADMIN"
        } == true
    if (!isAdmin) {
      throw AccessDeniedException("Only taxonomy admins can modify non-default versions")
    }
    return true
  }

  companion object {
    private val MUTATING_METHODS = setOf("POST", "PUT", "PATCH", "DELETE")
  }
}
