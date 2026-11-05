/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import io.circe.generic.auto.*
import no.ndla.network.tapir.NoNullJsonPrinter.*
import no.ndla.network.tapir.{ErrorBody, ErrorHelpers}
import sttp.model.StatusCode
import sttp.monad.MonadError
import sttp.tapir.generic.auto.schemaForCaseClass
import sttp.tapir.server.interceptor.RequestResult
import sttp.tapir.server.interceptor.reject.{RejectContext, RejectHandler}
import sttp.tapir.server.model.ValuedEndpointOutput
import sttp.tapir.{EndpointInput, statusCode}

case class NdlaRejectHandler[A[_]]()(using errorHelpers: ErrorHelpers) extends RejectHandler[A] {
  override def apply(ctx: RejectContext)(implicit monad: MonadError[A]): A[Option[ValuedEndpointOutput[?]]] = {
    val statusCodeAndBody =
      if (hasMethodMismatch(ctx.failure)) {
        ValuedEndpointOutput(jsonBody[ErrorBody], errorHelpers.methodNotAllowed).prepend(
          statusCode,
          StatusCode.MethodNotAllowed,
        )
      } else {
        ValuedEndpointOutput(jsonBody[ErrorBody], errorHelpers.notFound).prepend(statusCode, StatusCode.NotFound)
      }
    monad.unit(Some(statusCodeAndBody))
  }

  private def hasMethodMismatch(f: RequestResult.Failure): Boolean = f
    .failures
    .map(_.failingInput)
    .exists {
      case _: EndpointInput.FixedMethod[_] => true
      case _                               => false
    }
}
