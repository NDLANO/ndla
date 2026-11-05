/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.LoggerContext
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.AppenderBase
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.concurrent.CopyOnWriteArrayList
import no.ndla.taxonomy.service.AbstractIntegrationTest
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.slf4j.Logger.ROOT_LOGGER_NAME
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.test.context.ActiveProfiles
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("junit")
class RequestMdcIntegrationTest : AbstractIntegrationTest() {
  @Value("\${local.server.port}") private var port: Int = 0

  private val appender = CapturingAppender()
  private val rootLogger =
      (LoggerFactory.getILoggerFactory() as LoggerContext).getLogger(ROOT_LOGGER_NAME)

  @BeforeEach
  fun attachAppender() {
    appender.start()
    rootLogger.addAppender(appender)
  }

  @AfterEach
  fun detachAppender() {
    rootLogger.detachAppender(appender)
    appender.stop()
  }

  private fun get(path: String, correlationId: String? = null): HttpResponse<String> {
    val request =
        HttpRequest.newBuilder(URI.create("http://localhost:$port$path")).GET().apply {
          correlationId?.let { header("X-Correlation-ID", it) }
        }
    return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString())
  }

  private fun unhandledExceptionLogs(): List<ILoggingEvent> =
      appender.events.filter { it.level == Level.ERROR && it.throwableProxy?.message == FAILURE }

  @Test
  fun `unhandled exception is logged with the incoming correlation id`() {
    val response = get("/test/unhandled", correlationId = "from-frontend-123")

    assertEquals(500, response.statusCode())
    assertEquals("from-frontend-123", response.headers().firstValue("X-Correlation-ID").get())
    val errors = unhandledExceptionLogs()
    assertFalse(errors.isEmpty(), "expected the unhandled exception to be logged")
    errors.forEach {
      assertEquals("from-frontend-123", it.mdcPropertyMap["correlationID"])
      assertEquals("/test/unhandled", it.mdcPropertyMap["requestPath"])
      assertEquals("GET", it.mdcPropertyMap["method"])
    }
  }

  @Test
  fun `unhandled exception is logged with the generated correlation id`() {
    val response = get("/test/unhandled")

    val correlationId = response.headers().firstValue("X-Correlation-ID").orElse(null)
    assertNotNull(correlationId)
    val errors = unhandledExceptionLogs()
    assertFalse(errors.isEmpty(), "expected the unhandled exception to be logged")
    errors.forEach { assertEquals(correlationId, it.mdcPropertyMap["correlationID"]) }
  }

  class CapturingAppender : AppenderBase<ILoggingEvent>() {
    val events = CopyOnWriteArrayList<ILoggingEvent>()

    override fun append(event: ILoggingEvent) {
      event.prepareForDeferredProcessing()
      events.add(event)
    }
  }

  @TestConfiguration
  class ThrowingControllerConfig {
    @Bean fun throwingController() = ThrowingController()
  }

  @RestController
  class ThrowingController {
    @GetMapping("/test/unhandled") fun fail(): String = throw IllegalStateException(FAILURE)
  }

  companion object {
    private const val FAILURE = "unhandled failure from RequestMdcIntegrationTest"
  }
}
