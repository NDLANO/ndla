/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import com.auth0.jwk.JwkException
import com.auth0.jwk.JwkProvider
import com.auth0.jwk.UrlJwkProvider
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletRequest
import jakarta.servlet.ServletResponse
import jakarta.servlet.http.HttpServletRequest
import java.security.interfaces.RSAPublicKey
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.annotation.Profile
import org.springframework.context.event.EventListener
import org.springframework.core.annotation.Order
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.GenericFilterBean

@Profile("auth")
@Component
@Order(2)
class AuthFilter : GenericFilterBean() {

  @Value("\${auth0.audience}") private lateinit var audience: String

  @Value("\${auth0.issuer}") private lateinit var issuer: String

  @Value("\${auth0.jwks.kid}") private lateinit var kid: String

  private var publicKey: RSAPublicKey? = null

  @EventListener(ApplicationReadyEvent::class)
  fun initializePublicKeyOnApplicationStartup() {
    val provider: JwkProvider = UrlJwkProvider(issuer)
    try {
      val jwk = provider.get(kid)
      publicKey = jwk.publicKey as RSAPublicKey
    } catch (ex: JwkException) {
      LOGGER.error("Failed to fetch public key from $issuer", ex)
    }
  }

  override fun doFilter(
      servletRequest: ServletRequest,
      servletResponse: ServletResponse,
      filterChain: FilterChain,
  ) {
    parseWebToken(servletRequest as HttpServletRequest)
    filterChain.doFilter(servletRequest, servletResponse)
  }

  private fun parseWebToken(request: HttpServletRequest) {
    val authorizationHeader = request.getHeader("authorization")
    if (!authorizationHeader.isNullOrBlank() && authorizationHeader.startsWith("Bearer")) {
      SecurityContextHolder.getContext().authentication =
          JWTAuthentication(verifyWebToken(authorizationHeader.substring(6).trim { it <= ' ' }))
    }
  }

  private fun verifyWebToken(token: String): DecodedJWT {
    val algorithm = Algorithm.RSA256(publicKey, null)
    val verifier = JWT.require(algorithm).withAnyOfAudience(audience).build()
    return verifier.verify(token)
  }

  companion object {
    private val LOGGER = LoggerFactory.getLogger(AuthFilter::class.java)
  }
}
