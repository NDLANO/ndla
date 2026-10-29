/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.jwt

import com.nimbusds.jose.jwk.source.JWKSourceBuilder
import com.nimbusds.jose.proc.{JWSVerificationKeySelector, SecurityContext}
import com.nimbusds.oauth2.sdk.id.Issuer
import com.nimbusds.openid.connect.sdk.op.OIDCProviderMetadata
import no.ndla.common.implicits.*

import scala.util.Try

trait JwsKeySelectorFactory {
  def fromIssuer(issuerUrl: String): Try[JWSVerificationKeySelector[SecurityContext]]
}

case object DefaultJwsKeySelectorFactory extends JwsKeySelectorFactory {
  private val cacheTimeToLive     = 24 * 60 * 60 * 1000L // 1 day
  private val cacheRefreshTimeout = 15 * 1000L           // 15 seconds

  override def fromIssuer(issuerUrl: String): Try[JWSVerificationKeySelector[SecurityContext]] = for {
    metadata <- Try(OIDCProviderMetadata.resolve(new Issuer(issuerUrl))).flatMap(
      _.toOption.toTry(new IllegalStateException(s"Could not resolve OIDC metadata for $issuerUrl"))
    )
    jwkSetUrl <- metadata
      .getJWKSetURI
      .toOption
      .flatMap(_.toURL.toOption)
      .toTry(new IllegalStateException(s"Missing JWK set URI for $issuerUrl"))
    jwkSource <- JWKSourceBuilder
      .create[SecurityContext](jwkSetUrl)
      .toOption
      .flatMap(_.retrying(true).toOption)
      .flatMap(_.cache(cacheTimeToLive, cacheRefreshTimeout).toOption)
      .flatMap(_.refreshAheadCache(true).toOption)
      .flatMap(_.outageTolerantForever().toOption)
      .flatMap(_.rateLimited(false).toOption)
      .flatMap(_.build().toOption)
      .toTry(new IllegalStateException(s"Could not build JWK source for $issuerUrl"))
    algs = new java.util.HashSet(metadata.getIDTokenJWSAlgs)
  } yield new JWSVerificationKeySelector(algs, jwkSource)
}
