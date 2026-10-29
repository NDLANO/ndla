/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network

import io.prometheus.metrics.core.metrics.{Counter, Histogram}
import no.ndla.common.implicits.toOption
import no.ndla.network.tapir.NdlaPrometheusRegistry

object NdlaClientMetrics {
  val SlowRequestThresholdMs: Double = 3000.0

  private val requestsTotal: Option[Counter] = Counter
    .builder()
    .toOption
    .flatMap(_.name("ndla_http_client_requests_total").toOption)
    .flatMap(
      _.help("Outgoing HTTP client requests that got a response, by target host, method and response status.").toOption
    )
    .flatMap(_.labelNames("host", "method", "status").toOption)
    .flatMap(_.register(NdlaPrometheusRegistry.registry).toOption)

  private val requestDurationSeconds: Option[Histogram] = Histogram
    .builder()
    .toOption
    .flatMap(_.name("ndla_http_client_request_duration_seconds").toOption)
    .flatMap(_.help("Outgoing HTTP client request duration in seconds, by target host and method.").toOption)
    .flatMap(_.labelNames("host", "method").toOption)
    .flatMap(_.classicUpperBounds(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0).toOption)
    .flatMap(_.register(NdlaPrometheusRegistry.registry).toOption)

  private val failuresTotal: Option[Counter] = Counter
    .builder()
    .toOption
    .flatMap(_.name("ndla_http_client_failures_total").toOption)
    .flatMap(
      _.help("Outgoing HTTP client requests that failed before a response, by host, method and exception class.")
        .toOption
    )
    .flatMap(_.labelNames("host", "method", "exception").toOption)
    .flatMap(_.register(NdlaPrometheusRegistry.registry).toOption)

  def observe(host: String, method: String, status: Int, millis: Double): Unit = {
    requestsTotal.flatMap(_.labelValues(host, method, status.toString).toOption).foreach(_.inc())
    requestDurationSeconds.flatMap(_.labelValues(host, method).toOption).foreach(_.observe(millis / 1000.0))
  }

  def observeFailure(host: String, method: String, t: Throwable): Unit = {
    failuresTotal.flatMap(_.labelValues(host, method, t.getClass.getSimpleName).toOption).foreach(_.inc())
  }
}
