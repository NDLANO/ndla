/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy

import no.ndla.taxonomy.security.JWTPermission
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class JWTPermissionsTest {

  @Test
  fun can_parse_one_permission() {
    val scope = "drafts-staging:write"
    val jwtPermission = JWTPermission(scope)
    assertEquals("drafts", jwtPermission.api)
    assertEquals("staging", jwtPermission.environment)
    assertEquals("write", jwtPermission.permission)
  }

  @Test
  fun can_parse_permission_with_no_dash() {
    val scope = "drafts:write"
    val jwtPermission = JWTPermission(scope)
    assertEquals("drafts", jwtPermission.api)
    assertEquals("write", jwtPermission.permission)
    assertNull(jwtPermission.environment)
  }
}
