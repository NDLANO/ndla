/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import io.circe.generic.auto.*
import io.opentelemetry.api.trace.Span
import no.ndla.common.implicits.toOption
import no.ndla.network.tapir.NoNullJsonPrinter.*
import no.ndla.network.tapir.{AllErrors, ErrorHandling}
import sttp.model.StatusCode
import sttp.monad.MonadError
import sttp.tapir.generic.auto.schemaForCaseClass
import sttp.tapir.server.interceptor.exception.{ExceptionContext, ExceptionHandler}
import sttp.tapir.server.model.ValuedEndpointOutput
import sttp.tapir.statusCode

case class NdlaExceptionHandler[T[_]]()(using errorHandling: ErrorHandling) extends ExceptionHandler[T] {
  override def apply(ctx: ExceptionContext)(implicit monad: MonadError[T]): T[Option[ValuedEndpointOutput[?]]] = {
    Span.current().toOption.foreach(_.recordException(ctx.e))
    val errorToReturn = errorHandling.returnError(ctx.e)
    val sc            = StatusCode(errorToReturn.statusCode)
    val resp          = ValuedEndpointOutput(jsonBody[AllErrors], errorToReturn)
    val withsc        = resp.prepend(statusCode, sc)
    monad.unit(Some(withsc))
  }
}
