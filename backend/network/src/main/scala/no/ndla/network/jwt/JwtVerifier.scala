/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.jwt

import com.nimbusds.jose.proc.{BadJOSEException, BadJWSException, SecurityContext}
import com.nimbusds.jwt.proc.{DefaultJWTProcessor, ExpiredJWTException as NimbusExpiredJWTException}
import no.ndla.common.implicits.*
import no.ndla.network.model.*

import java.text.ParseException
import scala.util.{Failure, Success, Try}

case class JwtVerifier(
    jwsKeySelectorFactory: JwsKeySelectorFactory,
    issuer: String,
    audience: Option[String],
    extraIssuers: Set[String],
) {
  @volatile
  private var processor: Option[DefaultJWTProcessor[SecurityContext]] = None
  // Try to create processor eagerly at startup instead of on first (auth) request
  val _ = getProcessor

  def decode[A](token: String)(using decoder: JwtDecoder[A]): Try[A] =
    verify(token).flatMap(claims => decoder.decode(claims, token).toTry)

  def verify(token: String): Try[JWTClaimsSetWrapper] = process(token) match {
    case _ if audience.isEmpty                 => Failure(MissingAudienceConfiguration(issuer))
    case Success(claims)                       => Success(claims)
    case Failure(_: ParseException)            => Failure(JwtParseException())
    case Failure(_: NimbusExpiredJWTException) => Failure(ExpiredJwtException())
    case Failure(_: BadJWSException)           => Failure(InvalidJwtSignatureException())
    case Failure(ex: BadJOSEException)         => Failure(InvalidJwtException(ex))
    case Failure(ex)                           => Failure(UnexpectedNimbusException(ex))
  }

  private def process(token: String): Try[JWTClaimsSetWrapper] = for {
    proc   <- getProcessor
    claims <- Try(proc.process(token, null)).flatMap(
      _.toOption.toTry(new IllegalStateException("JWT processor returned no claims"))
    )
  } yield JWTClaimsSetWrapper(claims)

  private def getProcessor: Try[DefaultJWTProcessor[SecurityContext]] = processor match {
    case Some(p) => Success(p)
    case None    => synchronized {
        processor match {
          case Some(p) => Success(p)
          case None    => Try(jwsKeySelectorFactory.fromIssuer(issuer))
              .flatten
              .map { jwsKeySelector =>
                val proc = new DefaultJWTProcessor[SecurityContext]()
                proc.setJWSKeySelector(jwsKeySelector)
                proc.setJWTClaimsSetVerifier(MultiIssuerClaimsVerifier(audience, extraIssuers + issuer))
                processor = Some(proc)
                proc
              }
        }
      }
  }
}
