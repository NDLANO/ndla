/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class VaryOnAuthorizationFilter : OncePerRequestFilter() {
  override fun doFilterInternal(
      request: HttpServletRequest,
      response: HttpServletResponse,
      filterChain: FilterChain,
  ) {
    response.addHeader(HttpHeaders.VARY, HttpHeaders.AUTHORIZATION)
    filterChain.doFilter(request, response)
  }
}
