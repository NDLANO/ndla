/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.jwt

import com.nimbusds.jwt.JWTClaimsSet
import no.ndla.common.implicits.toOption
import no.ndla.network.model.{ClaimParseException, ForbiddenException, MissingClaimException}

import scala.jdk.CollectionConverters.*
import scala.util.{Failure, Success, Try}

opaque type JWTClaimsSetWrapper = JWTClaimsSet

object JWTClaimsSetWrapper {
  def apply(claims: JWTClaimsSet): JWTClaimsSetWrapper = claims

  extension (claims: JWTClaimsSetWrapper) {
    def stringListClaim(name: String): Either[ForbiddenException, List[String]] = doSafe(name)(_.getStringListClaim)
      .map(_.asScala.toList)
    def stringClaim(name: String): Either[ForbiddenException, String] = doSafe(name)(_.getStringClaim)
    def longClaim(name: String): Either[ForbiddenException, Long]     = doSafe(name)(_.getLongClaim).map(_.longValue)

    def stringListOptClaim(name: String): Either[ClaimParseException, Option[List[String]]] =
      doSafeOpt(name)(_.getStringListClaim).map(listOpt => listOpt.map(_.asScala.toList))
    def stringOptClaim(name: String): Either[ClaimParseException, Option[String]] = doSafeOpt(name)(_.getStringClaim)

    def issueTime: Either[ForbiddenException, Long] = claims
      .getIssueTime
      .toOption
      .flatMap(_.toInstant.toOption)
      .map(_.getEpochSecond)
      .toRight(MissingClaimException("iat"))

    def expirationTime: Either[ForbiddenException, Long] = claims
      .getExpirationTime
      .toOption
      .flatMap(_.toInstant.toOption)
      .map(_.getEpochSecond)
      .toRight(MissingClaimException("exp"))

    def audience: Either[ForbiddenException, List[String]] =
      claims.getAudience.toOption.map(_.asScala.toList).getOrElse(Nil) match {
        case Nil => Left(MissingClaimException("aud"))
        case l   => Right(l)
      }

    private def doSafe[A](name: String)(f: JWTClaimsSet => String => A | Null): Either[ForbiddenException, A] = {
      Try(f(claims)(name).toOption) match {
        case Success(Some(a)) => Right(a)
        case Success(None)    => Left(MissingClaimException(name))
        case Failure(ex)      => Left(ClaimParseException(name, ex))
      }
    }

    private def doSafeOpt[A](
        name: String
    )(f: JWTClaimsSet => String => A | Null): Either[ClaimParseException, Option[A]] = Try(f(claims)(name).toOption)
      .toEither
      .left
      .map(ex => ClaimParseException(name, ex))
  }
}
