/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.concurrent.CopyOnWriteArrayList
import no.ndla.taxonomy.service.AbstractIntegrationTest
import org.apache.logging.log4j.Level
import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.core.LogEvent
import org.apache.logging.log4j.core.LoggerContext
import org.apache.logging.log4j.core.appender.AbstractAppender
import org.apache.logging.log4j.core.config.Property
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
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
  private val loggerContext
    get() = LogManager.getContext(false) as LoggerContext

  @BeforeEach
  fun attachAppender() {
    appender.start()
    loggerContext.configuration.rootLogger.addAppender(appender, null, null)
    loggerContext.updateLoggers()
  }

  @AfterEach
  fun detachAppender() {
    loggerContext.configuration.rootLogger.removeAppender(appender.name)
    loggerContext.updateLoggers()
    appender.stop()
  }

  private fun get(path: String, correlationId: String? = null): HttpResponse<String> {
    val request =
        HttpRequest.newBuilder(URI.create("http://localhost:$port$path")).GET().apply {
          correlationId?.let { header("X-Correlation-ID", it) }
        }
    return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString())
  }

  private fun unhandledExceptionLogs(): List<LogEvent> =
      appender.events.filter { it.level == Level.ERROR && it.thrown?.message == FAILURE }

  @Test
  fun `unhandled exception is logged with the incoming correlation id`() {
    val response = get("/test/unhandled", correlationId = "from-frontend-123")

    assertEquals(500, response.statusCode())
    assertEquals("from-frontend-123", response.headers().firstValue("X-Correlation-ID").get())
    val errors = unhandledExceptionLogs()
    assertFalse(errors.isEmpty(), "expected the unhandled exception to be logged")
    errors.forEach {
      assertEquals("from-frontend-123", it.contextData.toMap()["correlationID"])
      assertEquals("/test/unhandled", it.contextData.toMap()["requestPath"])
      assertEquals("GET", it.contextData.toMap()["method"])
    }
  }

  @Test
  fun `unhandled exception is logged with the generated correlation id`() {
    val response = get("/test/unhandled")

    val correlationId = response.headers().firstValue("X-Correlation-ID").orElse(null)
    assertNotNull(correlationId)
    val errors = unhandledExceptionLogs()
    assertFalse(errors.isEmpty(), "expected the unhandled exception to be logged")
    errors.forEach { assertEquals(correlationId, it.contextData.toMap()["correlationID"]) }
  }

  class CapturingAppender : AbstractAppender("capturing", null, null, true, Property.EMPTY_ARRAY) {
    val events = CopyOnWriteArrayList<LogEvent>()

    override fun append(event: LogEvent) {
      events.add(event.toImmutable())
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
