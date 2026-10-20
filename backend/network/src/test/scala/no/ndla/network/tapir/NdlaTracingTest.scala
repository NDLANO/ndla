/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import io.opentelemetry.api.GlobalOpenTelemetry
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator
import io.opentelemetry.api.trace.{SpanKind, StatusCode}
import io.opentelemetry.context.propagation.ContextPropagators
import io.opentelemetry.sdk.OpenTelemetrySdk
import io.opentelemetry.sdk.testing.exporter.InMemorySpanExporter
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.data.SpanData
import io.opentelemetry.sdk.trace.`export`.SimpleSpanProcessor
import no.ndla.common.auth.Permission
import no.ndla.common.configuration.{BaseProps, Constants}
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.tapirtesting.TapirControllerTest
import sttp.client4.quick.*
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint

import scala.jdk.CollectionConverters.*

class NdlaTracingTest extends UnitTestSuite, TapirControllerTest {
  override implicit lazy val props: BaseProps = new BaseProps {
    override def ApplicationPort: Int             = findFreePort
    override def ApplicationName: String          = "NdlaTracingTest"
    override val ndlaAuth0Scopes: Seq[Permission] = Seq.empty
  }
  override implicit lazy val errorHandling: ErrorHandling = new ErrorHandling() {
    override def handleErrors: PartialFunction[Throwable, AllErrors] = PartialFunction.empty
  }
  override val controller: TracingTestController = new TracingTestController

  class TracingTestController(using errorHandling: ErrorHandling) extends TapirController {
    override val prefix: EndpointInput[Unit]               = "tracing"
    override val endpoints: List[ServerEndpoint[Any, Eff]] = List(getThing, deleteThing, failing)

    private def getThing: ServerEndpoint[Any, Eff] = endpoint
      .get
      .in("things" / path[Long]("id"))
      .out(stringBody)
      .serverLogicPure(id => Right(s"Got $id"))

    private def deleteThing: ServerEndpoint[Any, Eff] = endpoint
      .delete
      .in("things" / path[Long]("id"))
      .out(stringBody)
      .serverLogicPure(id => Right(s"Deleted $id"))

    private def failing: ServerEndpoint[Any, Eff] = endpoint
      .get
      .in("fail")
      .out(stringBody)
      .serverLogicPure(_ => throw new RuntimeException("Expected tracing test failure"))
  }

  private val spanExporter = InMemorySpanExporter.create()
  private val route        = AttributeKey.stringKey("http.route")
  private val statusCode   = AttributeKey.longKey("http.response.status_code")

  override def beforeAll(): Unit = {
    GlobalOpenTelemetry.resetForTest()
    GlobalOpenTelemetry.set(
      OpenTelemetrySdk
        .builder()
        .setTracerProvider(
          SdkTracerProvider.builder().addSpanProcessor(SimpleSpanProcessor.create(spanExporter)).build()
        )
        .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
        .build()
    )
    super.beforeAll()
  }

  override def afterAll(): Unit = {
    super.afterAll()
    GlobalOpenTelemetry.resetForTest()
  }

  private def serverSpans(): List[SpanData] = spanExporter
    .getFinishedSpanItems
    .asScala
    .toList
    .filter(_.getKind == SpanKind.SERVER)

  test("that a request gets a single server span named after the matched route") {
    spanExporter.reset()
    val response = quickRequest
      .delete(uri"http://localhost:$serverPort/tracing/things/1")
      .header(Constants.CorrelationIdHeader, "tracing-test")
      .send()
    response.code.code should be(200)

    inside(serverSpans()) { case List(span) =>
      span.getName should be("DELETE /tracing/things/{id}")
      span.getAttributes.get(route) should be("/tracing/things/{id}")
      span.getAttributes.get(statusCode) should be(200L)
      span.getAttributes.get(AttributeKey.stringKey("ndla.correlation_id")) should be("tracing-test")
    }
  }

  test("that requests not matching any endpoint are traced with the rejection status") {
    spanExporter.reset()
    quickRequest.get(uri"http://localhost:$serverPort/tracing/missing").send().code.code should be(404)

    inside(serverSpans()) { case List(span) =>
      span.getName should be("GET")
      span.getAttributes.get(statusCode) should be(404L)
    }
  }

  test("that exceptions are recorded on the span and mark it as an error") {
    spanExporter.reset()
    quickRequest.get(uri"http://localhost:$serverPort/tracing/fail").send().code.code should be(500)

    inside(serverSpans()) { case List(span) =>
      span.getName should be("GET /tracing/fail")
      span.getStatus.getStatusCode should be(StatusCode.ERROR)
      span.getAttributes.get(statusCode) should be(500L)
      span.getEvents.asScala.map(_.getName) should contain("exception")
    }
  }

  test("that the incoming trace context is used as parent") {
    spanExporter.reset()
    val traceId      = "0af7651916cd43dd8448eb211c80319c"
    val parentSpanId = "b7ad6b7169203331"
    quickRequest
      .get(uri"http://localhost:$serverPort/tracing/things/1")
      .header("traceparent", s"00-$traceId-$parentSpanId-01")
      .send()
      .code
      .code should be(200)

    inside(serverSpans()) { case List(span) =>
      span.getTraceId should be(traceId)
      span.getParentSpanId should be(parentSpanId)
    }
  }
}
