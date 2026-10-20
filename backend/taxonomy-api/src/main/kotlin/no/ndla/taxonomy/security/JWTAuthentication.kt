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
import java.util.Collections
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

    val auths = ArrayList<GrantedAuthority>()
    auths.add(SimpleGrantedAuthority("READONLY"))

    try {
      if (permissions?.asArray(String::class.java) != null) {
        auths.addAll(addPermissionsAsAuthorities(permissions.asArray(String::class.java)))
      } else if (scope?.asString() != null) {
        auths.addAll(addPermissionsAsAuthorities(scope.asString().split(" ").toTypedArray()))
      }
    } catch (e: Exception) {
      LOGGER.error("JWT Authentication failed", e)
    }

    this.authorities = Collections.unmodifiableList(auths)
    this.claims = token.claims
    authenticated = true
  }

  private fun addPermissionsAsAuthorities(allPermissions: Array<String>): List<GrantedAuthority> {
    val authorities = ArrayList<GrantedAuthority>()
    for (jwtPermissionString in allPermissions) {
      val jwtPermission = JWTPermission(jwtPermissionString)
      if (jwtPermission.api != null &&
          jwtPermission.permission != null &&
          TAXONOMY_API == jwtPermission.api) {
        if (WRITE_PERMISSION == jwtPermission.permission)
            authorities.add(SimpleGrantedAuthority("TAXONOMY_WRITE"))
        if (ADMIN_PERMISSION == jwtPermission.permission)
            authorities.add(SimpleGrantedAuthority("TAXONOMY_ADMIN"))
      }
    }
    return authorities
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
    private const val WRITE_PERMISSION = "write"
    private const val ADMIN_PERMISSION = "admin"

    private val LOGGER = LoggerFactory.getLogger(JWTAuthentication::class.java)
  }
}
