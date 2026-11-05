/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import com.typesafe.scalalogging.StrictLogging
import io.circe.generic.auto.*
import no.ndla.network.model.{
  AuthException,
  ForbiddenException,
  GetFeideUserWrapperException,
  InvalidJwtException,
  MissingAudienceConfiguration,
  UnauthenticatedException,
  UnexpectedNimbusException,
}
import no.ndla.network.tapir.NoNullJsonPrinter.*
import no.ndla.network.tapir.{AllErrors, ErrorHelpers}
import sttp.model.{Header, StatusCode}
import sttp.monad.MonadError
import sttp.shared.Identity
import sttp.tapir.generic.auto.schemaForCaseClass
import sttp.tapir.server.interceptor.DecodeFailureContext
import sttp.tapir.server.interceptor.decodefailure.{DecodeFailureHandler, DefaultDecodeFailureHandler}
import sttp.tapir.server.model.ValuedEndpointOutput
import sttp.tapir.{DecodeResult, headers, statusCode}

class NdlaDecodeFailureHandler(using errorHelpers: ErrorHelpers) extends DecodeFailureHandler[Identity], StrictLogging {
  override def apply(ctx: DecodeFailureContext)(implicit
      monad: MonadError[Identity]
  ): Identity[Option[ValuedEndpointOutput[((StatusCode, List[Header]), AllErrors)]]] = ctx.failure match {
    case DecodeResult.Error(_, ex: AuthException) => handleAuthFailure(ex)
    case _                                        =>
      val res = DefaultDecodeFailureHandler
        .respond(ctx)
        .map { case (sc, hs) =>
          val failureMsg      = DefaultDecodeFailureHandler.FailureMessages.failureMessage(ctx)
          val errorBodyOutput = ValuedEndpointOutput(jsonBody[AllErrors], errorHelpers.badRequest(failureMsg))
          errorBodyOutput.prepend(statusCode.and(headers), (sc, hs))
        }
      monad.unit(res)
  }

  private def handleAuthFailure(
      ex: AuthException
  ): Option[ValuedEndpointOutput[((StatusCode, List[Header]), AllErrors)]] = {
    val (sc, body) = ex match {
      case _: MissingAudienceConfiguration =>
        logger.error(ex.message, ex)
        (StatusCode.InternalServerError, errorHelpers.generic)
      case _: UnexpectedNimbusException =>
        logger.error(ex.message, ex)
        (StatusCode.InternalServerError, errorHelpers.generic)
      case _: GetFeideUserWrapperException =>
        logger.error(ex.message, ex)
        (StatusCode.InternalServerError, errorHelpers.generic)
      case _: InvalidJwtException =>
        logger.error(ex.message, ex)
        (StatusCode.Unauthorized, errorHelpers.unauthorized.copy(description = ex.message))
      case _: UnauthenticatedException =>
        (StatusCode.Unauthorized, errorHelpers.unauthorized.copy(description = ex.message))
      case _: ForbiddenException => (StatusCode.Forbidden, errorHelpers.forbidden.copy(description = ex.message))
    }
    val errorBodyOutput = ValuedEndpointOutput(jsonBody[AllErrors], body)
    Some(errorBodyOutput.prepend(statusCode.and(headers), (sc, Nil)))
  }
}
