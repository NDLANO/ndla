/*
 * Part of NDLA network
 * Copyright (C) 2020 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.configuration.BaseProps
import no.ndla.network.tapir.interceptors.{
  ContextInterceptor,
  LogInterceptor,
  NdlaDecodeFailureHandler,
  NdlaExceptionHandler,
  NdlaRejectHandler,
  TracingInterceptor,
}
import ox.{never, supervised, useInScope}
import sttp.shared.Identity
import sttp.tapir.server.netty.NettyConfig
import sttp.tapir.server.netty.sync.{NettySyncServer, NettySyncServerBinding, NettySyncServerOptions}

import scala.concurrent.duration.DurationInt

class NdlaServer(using
    errorHelpers: ErrorHelpers,
    errorHandling: ErrorHandling,
    services: List[TapirController],
    props: BaseProps,
) extends StrictLogging {
  def startServerAndWait(name: String, port: Int)(onStartup: NettySyncServerBinding => Unit): Unit = {
    val prometheusMetrics = NdlaPrometheusRegistry.tapirPrometheusMetrics

    val options = NettySyncServerOptions
      .customiseInterceptors
      .rejectHandler(NdlaRejectHandler[Identity]())
      .exceptionHandler(NdlaExceptionHandler[Identity]())
      .decodeFailureHandler(NdlaDecodeFailureHandler())
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
