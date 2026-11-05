/*
 * Part of NDLA network
 * Copyright (C) 2020 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import com.typesafe.scalalogging.StrictLogging
import io.circe.generic.auto.*
import io.opentelemetry.api.trace.Span
import no.ndla.common.configuration.BaseProps
import no.ndla.network.model.*
import no.ndla.network.tapir.NoNullJsonPrinter.*
import no.ndla.network.tapir.interceptors.{ContextInterceptor, LogInterceptor, TracingInterceptor}
import ox.{never, supervised, useInScope}
import sttp.model.{Header, StatusCode}
import sttp.monad.MonadError
import sttp.shared.Identity
import sttp.tapir.generic.auto.schemaForCaseClass
import sttp.tapir.server.interceptor.decodefailure.{DecodeFailureHandler, DefaultDecodeFailureHandler}
import sttp.tapir.server.interceptor.exception.{ExceptionContext, ExceptionHandler}
import sttp.tapir.server.interceptor.reject.{RejectContext, RejectHandler}
import sttp.tapir.server.interceptor.{DecodeFailureContext, RequestResult}
import sttp.tapir.server.model.ValuedEndpointOutput
import sttp.tapir.server.netty.NettyConfig
import sttp.tapir.server.netty.sync.{NettySyncServer, NettySyncServerBinding, NettySyncServerOptions}
import sttp.tapir.{DecodeResult, EndpointInput, headers, statusCode}

import scala.concurrent.duration.DurationInt

class Routes(using
    errorHelpers: ErrorHelpers,
    errorHandling: ErrorHandling,
    services: List[TapirController],
    props: BaseProps,
) extends StrictLogging {
  private def failureResponse(error: String, exception: Option[Throwable]): ValuedEndpointOutput[?] = {
    val logMsg = s"Failure handler got: $error"
    exception match {
      case Some(ex) => logger.error(logMsg, ex)
      case None     => logger.error(logMsg)
    }

    ValuedEndpointOutput(jsonBody[AllErrors], errorHelpers.generic)
  }

  private object NdlaDecodeFailureHandler extends DecodeFailureHandler[Identity] {
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

  private case class NdlaExceptionHandler[T[_]]() extends ExceptionHandler[T] {
    override def apply(ctx: ExceptionContext)(implicit monad: MonadError[T]): T[Option[ValuedEndpointOutput[?]]] = {
      val _             = Span.current().recordException(ctx.e)
      val errorToReturn = errorHandling.returnError(ctx.e)
      val sc            = StatusCode(errorToReturn.statusCode)
      val resp          = ValuedEndpointOutput(jsonBody[AllErrors], errorToReturn)
      val withsc        = resp.prepend(statusCode, sc)
      monad.unit(Some(withsc))
    }
  }

  private def hasMethodMismatch(f: RequestResult.Failure): Boolean = f
    .failures
    .map(_.failingInput)
    .exists {
      case _: EndpointInput.FixedMethod[_] => true
      case _                               => false
    }

  private case class NdlaRejectHandler[A[_]]() extends RejectHandler[A] {

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
  }

  def startServerAndWait(name: String, port: Int)(onStartup: NettySyncServerBinding => Unit): Unit = {
    val prometheusMetrics = NdlaPrometheusRegistry.tapirPrometheusMetrics

    val options = NettySyncServerOptions
      .customiseInterceptors
      .defaultHandlers(err => failureResponse(err, None))
      .rejectHandler(NdlaRejectHandler[Identity]())
      .exceptionHandler(NdlaExceptionHandler[Identity]())
      .decodeFailureHandler(NdlaDecodeFailureHandler)
      .serverLog(None)
      .metricsInterceptor(prometheusMetrics.metricsInterceptor())
      .prependInterceptor(ContextInterceptor)
      .prependInterceptor(TracingInterceptor())
      .prependInterceptor(LogInterceptor)
      .options

    val gracefulShutdownTimeout = 30.seconds

    val config = NettyConfig
      .default
      .copy(gracefulShutdownTimeout = Option.when(props.Environment != "local")(gracefulShutdownTimeout))
      .connectionTimeout(30.seconds) // Use same connection timeout as Netty default
      .requestTimeout(55.minutes)    // Allow for long-running requests (e.g., internal indexing endpoints)
      .idleTimeout(61.minutes)       // Outlive backend 1h idle timeout to avoid reused closed connections
    val endpoints = services.flatMap(_.builtEndpoints)

    logger.info(s"Starting $name on port $port")

    supervised {
      val serverBinding = useInScope(
        NettySyncServer(options, config)
          .addEndpoints(endpoints)
          .addEndpoint(prometheusMetrics.metricsEndpoint)
          .host("0.0.0.0")
          .port(port)
          .start()
      )(_.stop())
      onStartup(serverBinding)
      never
    }
  }
}
