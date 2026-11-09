/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import com.typesafe.scalalogging.StrictLogging
import io.opentelemetry.api.GlobalOpenTelemetry
import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator
import io.opentelemetry.context.propagation.ContextPropagators
import io.opentelemetry.sdk.OpenTelemetrySdk
import io.opentelemetry.sdk.testing.exporter.InMemorySpanExporter
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.`export`.SimpleSpanProcessor
import no.ndla.common.auth.Permission
import no.ndla.common.configuration.{BaseProps, Constants}
import no.ndla.common.implicits.toOption
import no.ndla.network.tapir.{AllErrors, ErrorHandling, TapirController}
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.tapirtesting.TapirControllerTest
import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.core.appender.AbstractAppender
import org.apache.logging.log4j.core.{LogEvent, LoggerContext}
import sttp.client4.quick.*
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint

import java.util.concurrent.ConcurrentLinkedQueue
import scala.jdk.CollectionConverters.*

class RequestInterceptorsTest extends UnitTestSuite, TapirControllerTest {
  override implicit lazy val props: BaseProps = new BaseProps {
    override def ApplicationPort: Int             = findFreePort
    override def ApplicationName: String          = "RequestInterceptorsTest"
    override val ndlaAuth0Scopes: Seq[Permission] = Seq.empty
  }
  override implicit lazy val errorHandling: ErrorHandling = new ErrorHandling() {
    override def handleErrors: PartialFunction[Throwable, AllErrors] = PartialFunction.empty
  }
  override val controller: InterceptorsTestController = new InterceptorsTestController

  class InterceptorsTestController(using errorHandling: ErrorHandling) extends TapirController, StrictLogging {
    override val prefix: EndpointInput[Unit]               = "interceptors"
    override val endpoints: List[ServerEndpoint[Any, Eff]] = List(getThing, postThing)

    private def getThing: ServerEndpoint[Any, Eff] = endpoint
      .get
      .in("thing")
      .out(stringBody)
      .serverLogicPure { _ =>
        logger.info("inside endpoint logic")
        Right("ok")
      }

    private def postThing: ServerEndpoint[Any, Eff] = endpoint
      .post
      .in("thing")
      .in(stringJsonBody)
      .errorOut(statusCode)
      .out(stringBody)
      .serverLogicPure(_ => Left(StatusCode.BadRequest))
  }

  case class CapturedLog(message: String, traceId: Option[String], context: Map[String, String])

  private class CapturingAppender extends AbstractAppender("InterceptorsCapture", null, null, false, Array.empty) {
    val events = new ConcurrentLinkedQueue[CapturedLog]()

    override def append(event: LogEvent | Null): Unit = {
      val ctx = Span.current().nn.getSpanContext.nn
      val _   = events.add(
        CapturedLog(
          event.nn.getMessage.nn.getFormattedMessage.nn,
          Option.when(ctx.isValid)(ctx.getTraceId.nn),
          event.nn.getContextData.nn.toMap.nn.asScala.toMap,
        )
      )
    }
  }

  private val spanExporter = InMemorySpanExporter.create().nn
  private val appender     = new CapturingAppender

  override def beforeAll(): Unit = {
    GlobalOpenTelemetry.resetForTest()
    val tracerProvider = SdkTracerProvider
      .builder()
      .nn
      .addSpanProcessor(SimpleSpanProcessor.create(spanExporter))
      .nn
      .build()
    GlobalOpenTelemetry.set(
      OpenTelemetrySdk
        .builder()
        .toOption
        .value
        .setTracerProvider(tracerProvider)
        .nn
        .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
        .nn
        .build()
    )
    super.beforeAll()
  }

  override def afterAll(): Unit = {
    super.afterAll()
    GlobalOpenTelemetry.resetForTest()
  }

  private def captureLogs[T](f: => T): (T, List[CapturedLog]) = {
    val ndlaLogger = LogManager.getContext(false).asInstanceOf[LoggerContext].getLogger("no.ndla").nn
    appender.events.clear()
    appender.start()
    ndlaLogger.addAppender(appender)
    spanExporter.reset()
    try (f, appender.events.asScala.toList)
    finally ndlaLogger.removeAppender(appender)
  }

  private def traceIdOfRequest: String = {
    val traceIds = spanExporter.getFinishedSpanItems.nn.asScala.map(_.getTraceId.nn).distinct.toList
    traceIds.size should be(1)
    traceIds.head
  }

  test("that every log line written while handling a request has the request's trace id") {
    val (response, logs) = captureLogs(quickRequest.get(uri"http://localhost:$serverPort/interceptors/thing").send())
    response.code.code should be(200)

    val traceId     = traceIdOfRequest
    val requestLogs = logs.filter(_.message.contains("/interceptors/thing"))
    val endpointLog = logs.filter(_.message == "inside endpoint logic")
    requestLogs.size should be(2)
    endpointLog.size should be(1)
    (requestLogs ++ endpointLog).foreach(log => withClue(log.message)(log.traceId should be(Some(traceId))))
  }

  test("that the correlation id is echoed back and logged") {
    val (response, logs) = captureLogs(
      quickRequest
        .get(uri"http://localhost:$serverPort/interceptors/thing")
        .header(Constants.CorrelationIdHeader, "interceptors-test")
        .send()
    )

    response.header(Constants.CorrelationIdHeader) should be(Some("interceptors-test"))
    val requestLogs = logs.filter(_.message.contains("/interceptors/thing"))
    requestLogs.size should be(2)
    requestLogs.foreach(log =>
      withClue(log.message)(log.context.get("correlationID") should be(Some("interceptors-test")))
    )
  }

  test("that failed requests are logged with body, redacted headers and status code") {
    val (response, logs) = captureLogs(
      quickRequest
        .post(uri"http://localhost:$serverPort/interceptors/thing")
        .header("Authorization", "Bearer secret-token")
        .body("""{"some":"body"}""")
        .contentType("application/json")
        .send()
    )
    response.code.code should be(400)

    val afterLog = logs.find(_.message.contains("executed in")).get
    afterLog.traceId should be(Some(traceIdOfRequest))
    afterLog.context.get("statusCode") should be(Some("400"))
    afterLog.context.get("requestBody") should be(Some("""{"some":"body"}"""))
    afterLog.context.get("requestHeader.authorization") should be(Some("[REDACTED]"))
    afterLog.context.get("requestPath") should be(Some("/interceptors/thing"))
  }
}
