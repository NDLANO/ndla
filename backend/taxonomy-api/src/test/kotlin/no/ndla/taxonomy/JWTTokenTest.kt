/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy

import com.auth0.jwt.JWT
import com.auth0.jwt.interfaces.Claim
import com.auth0.jwt.interfaces.DecodedJWT
import no.ndla.taxonomy.security.JWTAuthentication
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.mockito.Mockito.`when`

class JWTTokenTest {

  private val authV2 =
      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6bEVPVFE1TTBOR01EazROakV4T0VKR01qYzJNalZGT0RoRVFrRTFOVUkyTmtFMFJUUXlSZyJ9.eyJpc3MiOiJodHRwczovL25kbGEtdGVzdC5ldS5hdXRoMC5jb20vIiwic3ViIjoiMjRaYmkyYjJycGdVVnZQNzFEV3ZTNUloVVk0ZlpGSjNAY2xpZW50cyIsImF1ZCI6Im5kbGFfc3lzdGVtIiwiaWF0IjoxNTQ0NTIwMjg3LCJleHAiOjE1NDQ1MjIwODcsImF6cCI6IjI0WmJpMmIycnBnVVZ2UDcxRFd2UzVJaFVZNGZaRkozIiwic2NvcGUiOiJ0YXhvbm9teTp3cml0ZSIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.Yon-Jm1RAe5jn0bS8NTQ2bIZWNAO-M3JN_G8PvxbuMtKLqOZ7SydAx9cgDysKg95HRj8tCVpj1fDttKSIm59Ww-400gmDTTlQPqdzlNWsXT7wgAllTboXEigGAmjj1tNKYFQxTdIa9azdiqUPT-e7ao5JOdM3_uYFiINC_MoxfFaezGSWeja4TkEakj8MyxGraKa6DhXrlLd1TfZtH6bv6mxEyAy_YmYZQ1vQ8iZKdGM1AHp703yoqITutrfzdZOx-yxNUcmPJwqzcm3cXd0RA-qwJ5NfsuZrS52NtrDqRaxGdIuai9W04nM5ZEfvkvpFGe8gU6fZ8is0ThiS39luQ"
  private val authV2WithAdmin =
      "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlF6bEVPVFE1TTBOR01EazROakV4T0VKR01qYzJNalZGT0RoRVFrRTFOVUkyTmtFMFJUUXlSZyJ9.eyJpc3MiOiJodHRwczovL25kbGEtdGVzdC5ldS5hdXRoMC5jb20vIiwic3ViIjoiZnNleE9DZkpGR09LdXkxQzJlNzFPc3ZRd3EwTldLQUtAY2xpZW50cyIsImF1ZCI6Im5kbGFfc3lzdGVtIiwiaWF0IjoxNjM2NTQ0MDIxLCJleHAiOjE2MzY1NDc2MjEsImF6cCI6ImZzZXhPQ2ZKRkdPS3V5MUMyZTcxT3N2UXdxME5XS0FLIiwic2NvcGUiOiJhcnRpY2xlczpwdWJsaXNoIGFydGljbGVzOndyaXRlIGF1ZGlvOndyaXRlIGNvbmNlcHQ6d3JpdGUgZHJhZnRzOmFkbWluIGRyYWZ0czpwdWJsaXNoIGRyYWZ0czp3cml0ZSBpbWFnZXM6d3JpdGUgbGVhcm5pbmdwYXRoOmFkbWluIGxlYXJuaW5ncGF0aDpwdWJsaXNoIGxlYXJuaW5ncGF0aDp3cml0ZSB0YXhvbm9teTphZG1pbiB0YXhvbm9teTp3cml0ZSIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.KFJ1HF1b3otp2WIKVDh9It_OwnWY6WkibcgxWJkyFfHFZERtgxRUCHVUKPxoQds4ooYjIv9mwx0jZNAjA0v2J6d8FB5sfKoEPTt4zO7TTSBkehytKgWawqtT_bBWoxYralw__hSWE2-q5UMbMN_i-Z09_8M9SojaWVF1cuTdLf4XBa24cl4oj4IfIQdGKaqI1qdXS8fwn0EoID419a3u-w_sg_m28R2lqdot-6gePeZZJE6dpTeiJC7rGDL9YDJ4JxnI4ZmAXvYMeResJJBFo_Ur5aqeXHZqr34y1LdywIiIWp7I0CMPk6T9HD_GxCLVmFk87zokxUT4Shx_Pa8y5A"
  private val authV2WithPermissions =
      "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlF6bEVPVFE1TTBOR01EazROakV4T0VKR01qYzJNalZGT0RoRVFrRTFOVUkyTmtFMFJUUXlSZyJ9.eyJodHRwczovL25kbGEubm8vbmRsYV9pZCI6Inlhc2QiLCJodHRwczovL25kbGEubm8vdXNlcl9uYW1lIjoiVGVzdCBCcnVrZXIiLCJodHRwczovL25kbGEubm8vdXNlcl9lbWFpbCI6InRlc3RAbmRsYS5ubyIsImlzcyI6Imh0dHBzOi8vbmRsYS10ZXN0LmV1LmF1dGgwLmNvbS8iLCJzdWIiOiJzdWIiLCJhdWQiOiJuZGxhX3N5c3RlbSIsImlhdCI6MTYzODg3OTM5NCwiZXhwIjoxNjM4ODgyOTk0LCJhenAiOiJGSzM1RkQzWUhPZWFZY1hHODBFVkNiQm1BZmlGR3ppViIsInNjb3BlIjoib3BlbmlkIGVtYWlsIiwicGVybWlzc2lvbnMiOlsidGF4b25vbXk6YWRtaW4iLCJ0YXhvbm9teTp3cml0ZSJdfQ.Tyf84pzpIpTs6vJKkIv_qDZPbYtjcZ7_0eeQl3c3JCls6y99vlZjCnMoBg9xSRstw1dvwbnqSrEPx5HDTWlJUegLwtApi4Xzv08bAE669jv_oJvZDRLJRnxcIHE6kRItmgI1jRcPs5wLcukkeEjCduTVjLeKXhbiLRv0OsWmz1nT7elMQ_yBltDkI725NPeH4RbVgr6u_ag8GlBEoJiQTYgW9II3eUdQvTh7PzxCb_hkktEvVjAn_vDIEs_2AqaPd2uAOpnkDZPujvfbBQFd75aJOuwwEKa06qECDTHG1z4F-mtN0IzVOBmh7i0rp7ovPmJEUhdb36--6jwstWYzpQ"

  @Test
  fun jwt_token_gives_read_write_permissions() {
    val jwt = JWT.decode(authV2.substring(6).trim())
    val token = JWTAuthentication(jwt)
    assertTrue(token.isAuthenticated)
    assertEquals(2, token.authorities.size)
    TestUtils.assertAnyTrue(token.authorities) { au -> "READONLY" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "TAXONOMY_WRITE" == au.authority }
  }

  @Test
  fun jwt_token_gives_read_write_admin_permissions() {
    val jwt = JWT.decode(authV2WithAdmin.substring(6).trim())
    val token = JWTAuthentication(jwt)
    assertTrue(token.isAuthenticated)
    assertEquals(6, token.authorities.size)
    TestUtils.assertAnyTrue(token.authorities) { au -> "READONLY" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "TAXONOMY_ADMIN" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "TAXONOMY_WRITE" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "DRAFTS_ADMIN" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "DRAFTS_PUBLISH" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "DRAFTS_WRITE" == au.authority }
  }

  @Test
  fun jwt_token_with_permissions_gives_read_write_admin_permissions() {
    val jwt = JWT.decode(authV2WithPermissions.substring(6).trim())
    val token = JWTAuthentication(jwt)
    assertTrue(token.isAuthenticated)
    assertEquals(3, token.authorities.size)
    TestUtils.assertAnyTrue(token.authorities) { au -> "READONLY" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "TAXONOMY_ADMIN" == au.authority }
    TestUtils.assertAnyTrue(token.authorities) { au -> "TAXONOMY_WRITE" == au.authority }
  }

  @Test
  fun no_scope_gives_readonly() {
    val mockDecodedJWT = Mockito.mock(DecodedJWT::class.java)
    val claim = Mockito.mock(Claim::class.java)
    `when`(claim.asString()).thenReturn(null)
    `when`(mockDecodedJWT.getClaim("scope")).thenReturn(claim)
    val token = JWTAuthentication(mockDecodedJWT)
    assertEquals(1, token.authorities.size)
    TestUtils.assertAnyTrue(token.authorities) { au -> "READONLY" == au.authority }
  }
}
