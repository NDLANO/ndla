/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.jwt

import com.nimbusds.jose.proc.SecurityContext
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.proc.{BadJWTException, DefaultJWTClaimsVerifier}
import no.ndla.common.implicits.toOption
import no.ndla.network.jwt.MultiIssuerClaimsVerifier.requiredClaimsFromIssuers

import scala.jdk.CollectionConverters.*

case class MultiIssuerClaimsVerifier(audience: Option[String], issuers: Set[String])
    extends DefaultJWTClaimsVerifier[SecurityContext](
      audience.toSet.asJava,
      null,
      requiredClaimsFromIssuers(issuers),
      null,
    ) {
  override def verify(claims: JWTClaimsSet | Null, context: SecurityContext | Null): Unit = {
    super.verify(claims, context)

    if !claims.toOption.flatMap(_.getIssuer.toOption).exists(issuers.contains) then
      throw new BadJWTException("JWT iss value rejected")
  }
}

object MultiIssuerClaimsVerifier {
  def requiredClaimsFromIssuers(issuers: Set[String]): java.util.Set[String] | Null =
    if issuers.isEmpty then
      null
    else
      java.util.Set.of("iss")
}
