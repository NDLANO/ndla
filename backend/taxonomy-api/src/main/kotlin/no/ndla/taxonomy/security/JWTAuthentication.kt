/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import com.auth0.jwt.interfaces.Claim
import com.auth0.jwt.interfaces.DecodedJWT
import java.io.Serial
import org.slf4j.LoggerFactory
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority

class JWTAuthentication(token: DecodedJWT) : Authentication {
  private val authorities: Collection<GrantedAuthority>
  private var authenticated: Boolean
  private val claims: Map<String, Claim>

  init {
    val scope = token.getClaim("scope")
    val permissions = token.getClaim("permissions")

    this.authorities =
        buildList {
              add(SimpleGrantedAuthority("READONLY"))
              try {
                if (permissions?.asArray(String::class.java) != null) {
                  addAll(addPermissionsAsAuthorities(permissions.asArray(String::class.java)))
                } else if (scope?.asString() != null) {
                  addAll(addPermissionsAsAuthorities(scope.asString().split(" ").toTypedArray()))
                }
              } catch (e: Exception) {
                LOGGER.error("JWT Authentication failed", e)
              }
            }
            .distinct()
    this.claims = token.claims
    authenticated = true
  }

  private fun addPermissionsAsAuthorities(allPermissions: Array<String>): List<GrantedAuthority> =
      allPermissions.mapNotNull { jwtPermissionString ->
        val jwtPermission = JWTPermission(jwtPermissionString)
        when (jwtPermission.api to jwtPermission.permission) {
          TAXONOMY_API to WRITE_PERMISSION -> "TAXONOMY_WRITE"
          TAXONOMY_API to ADMIN_PERMISSION -> "TAXONOMY_ADMIN"
          DRAFTS_API to WRITE_PERMISSION -> "DRAFTS_WRITE"
          DRAFTS_API to PUBLISH_PERMISSION -> "DRAFTS_PUBLISH"
          DRAFTS_API to ADMIN_PERMISSION -> "DRAFTS_ADMIN"
          else -> null
        }?.let(::SimpleGrantedAuthority)
      }

  override fun getCredentials(): Any = ""

  override fun getPrincipal(): Any = Any()

  override fun getName(): String = ""

  override fun getAuthorities(): Collection<GrantedAuthority> = authorities

  override fun getDetails(): Any = claims

  override fun isAuthenticated(): Boolean = authenticated

  override fun setAuthenticated(isAuthenticated: Boolean) {
    this.authenticated = isAuthenticated
  }

  companion object {
    @Serial private const val serialVersionUID = 1L

    private const val TAXONOMY_API = "taxonomy"
    private const val DRAFTS_API = "drafts"
    private const val WRITE_PERMISSION = "write"
    private const val PUBLISH_PERMISSION = "publish"
    private const val ADMIN_PERMISSION = "admin"

    private val LOGGER = LoggerFactory.getLogger(JWTAuthentication::class.java)
  }
}
