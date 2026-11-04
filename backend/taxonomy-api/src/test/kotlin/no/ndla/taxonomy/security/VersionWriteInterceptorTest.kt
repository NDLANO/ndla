/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import no.ndla.taxonomy.service.VersionContext
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.authentication.TestingAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.method.HandlerMethod

class VersionWriteInterceptorTest {

  private val defaultSchema = "taxonomy_api"
  private val versionSchema = "taxonomy_api_abcd"
  private val interceptor = VersionWriteInterceptor(defaultSchema)

  @Suppress("unused")
  private class TestController {
    @PreAuthorize("hasAuthority('TAXONOMY_WRITE')") fun write() {}

    fun search() {}
  }

  private val writeHandler = HandlerMethod(TestController(), "write")
  private val searchHandler = HandlerMethod(TestController(), "search")

  @AfterEach
  fun tearDown() {
    VersionContext.clear()
    SecurityContextHolder.clearContext()
  }

  private fun authenticateWith(vararg authorities: String) {
    SecurityContextHolder.getContext().authentication =
        TestingAuthenticationToken("user", null, *authorities)
  }

  private fun preHandle(method: String, schema: String, handler: Any = writeHandler): Boolean {
    VersionContext.setCurrentVersion(schema)
    return interceptor.preHandle(
        MockHttpServletRequest(method, "/v1/nodes"),
        MockHttpServletResponse(),
        handler,
    )
  }

  @Test
  fun writer_cannot_write_to_non_default_version() {
    authenticateWith("TAXONOMY_WRITE")
    assertThrows(AccessDeniedException::class.java) { preHandle("PUT", versionSchema) }
    assertThrows(AccessDeniedException::class.java) { preHandle("POST", versionSchema) }
    assertThrows(AccessDeniedException::class.java) { preHandle("PATCH", versionSchema) }
    assertThrows(AccessDeniedException::class.java) { preHandle("DELETE", versionSchema) }
  }

  @Test
  fun anonymous_cannot_write_to_non_default_version() {
    assertThrows(AccessDeniedException::class.java) { preHandle("PUT", versionSchema) }
  }

  @Test
  fun admin_can_write_to_non_default_version() {
    authenticateWith("TAXONOMY_WRITE", "TAXONOMY_ADMIN")
    assertTrue(preHandle("PUT", versionSchema))
  }

  @Test
  fun writer_can_write_to_default_version() {
    authenticateWith("TAXONOMY_WRITE")
    assertTrue(preHandle("PUT", defaultSchema))
  }

  @Test
  fun writer_can_read_non_default_version() {
    authenticateWith("TAXONOMY_WRITE")
    assertTrue(preHandle("GET", versionSchema))
    assertTrue(preHandle("QUERY", versionSchema))
    assertTrue(preHandle("POST", versionSchema, searchHandler))
  }
}
