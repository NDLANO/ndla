/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import io.opentelemetry.api.GlobalOpenTelemetry
import io.opentelemetry.api.common.Attributes
import no.ndla.common.CorrelationID
import no.ndla.common.implicits.toOption
import sttp.shared.Identity
import sttp.tapir.model.ServerRequest
import sttp.tapir.server.tracing.opentelemetry.{OpenTelemetryTracing, OpenTelemetryTracingConfig}

object NdlaTracing {
  private def requestAttributes(request: ServerRequest): Attributes = {
    val defaults = OpenTelemetryTracingConfig.Defaults.requestAttributes(request)
    defaults
      .toBuilder
      .toOption
      .flatMap { builder =>
        CorrelationID.get.foreach(id => builder.put("ndla.correlation_id", id))
        builder.build().toOption
      }
      .getOrElse(defaults)
  }

  /** Request interceptor that opens a SERVER span around the request, named `METHOD /path/template`, and makes it the
    * current context so downstream spans (JDBC, outgoing HTTP, ...) nest under it. By default the agent instruments raw
    * Netty requests, which has no knowledge of Tapir routes, so we disable that and the span is named and attributed
    * here. Must run after the interceptor that sets the [[CorrelationID]].
    */
  def tracingInterceptor: Option[OpenTelemetryTracing[Identity]] = GlobalOpenTelemetry
    .get()
    .toOption
    .map(otel => OpenTelemetryTracing(OpenTelemetryTracingConfig(otel, requestAttributes = requestAttributes)))
}
