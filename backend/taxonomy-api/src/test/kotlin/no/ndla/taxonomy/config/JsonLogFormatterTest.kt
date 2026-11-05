/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.LoggerContext
import ch.qos.logback.classic.pattern.ThrowableProxyConverter
import ch.qos.logback.classic.spi.LoggingEvent
import java.time.Instant
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper

class JsonLogFormatterTest {
  private val formatter = JsonLogFormatter(ThrowableProxyConverter().apply { start() })
  private val logger = LoggerContext().getLogger("no.ndla.taxonomy.SomeService")
  private val mapper = JsonMapper.builder().build()

  private fun event(
      mdc: Map<String, String> = emptyMap(),
      throwable: Throwable? = null,
  ): LoggingEvent =
      LoggingEvent(
              Logger::class.java.name, logger, Level.INFO, "hello {}", throwable, arrayOf("world"))
          .apply {
            instant = Instant.parse("2026-11-05T08:16:49.711912Z")
            threadName = "http-nio-5000-exec-1"
            mdcPropertyMap = mdc
            callerData =
                arrayOf(
                    StackTraceElement(
                        "no.ndla.taxonomy.SomeService", "doThing", "SomeService.kt", 42))
          }

  private fun format(event: LoggingEvent): JsonNode {
    val output = formatter.format(event)
    assertTrue(output.endsWith("\n"))
    assertEquals(1, output.lines().filter { it.isNotEmpty() }.size)
    return mapper.readTree(output)
  }

  @Test
  fun `uses the same field names as the log4j2 json layout`() {
    val json = format(event(mdc = mapOf("requestPath" to "/v1/nodes")))

    assertEquals(1793866609L, json["instant"]["epochSecond"].asLong())
    assertEquals(711912000, json["instant"]["nanoOfSecond"].asInt())
    assertEquals("http-nio-5000-exec-1", json["thread"].asString())
    assertEquals("INFO", json["level"].asString())
    assertEquals("no.ndla.taxonomy.SomeService", json["loggerName"].asString())
    assertEquals("hello world", json["message"].asString())
    assertEquals("/v1/nodes", json["contextMap"]["requestPath"].asString())
    assertEquals("no.ndla.taxonomy.SomeService", json["source"]["class"].asString())
    assertEquals("doThing", json["source"]["method"].asString())
    assertEquals("SomeService.kt", json["source"]["file"].asString())
    assertEquals(42, json["source"]["line"].asInt())
    assertEquals("2026-11-05T08:16:49.711Z", json["timestamp"].asString())
    assertFalse(json.has("thrown"))
  }

  @Test
  fun `lifts correlation and trace ids to top level fields`() {
    val mdc =
        mapOf(
            "correlationID" to "abc-123",
            "trace_id" to "0af7651916cd43dd8448eb211c80319c",
            "span_id" to "b7ad6b7169203331",
            "trace_flags" to "01",
        )
    val json = format(event(mdc = mdc))

    mdc.forEach { (key, value) ->
      assertEquals(value, json[key].asString())
      assertEquals(value, json["contextMap"][key].asString())
    }
  }

  @Test
  fun `omits correlation fields that are missing or empty`() {
    val json = format(event(mdc = mapOf("correlationID" to "")))

    listOf("correlationID", "trace_id", "span_id", "trace_flags").forEach {
      assertFalse(json.has(it), "expected no top level `$it`")
    }
  }

  @Test
  fun `includes thrown with full stack trace`() {
    val json = format(event(throwable = IllegalStateException("bad", RuntimeException("cause"))))

    val thrown = json["thrown"]
    assertEquals("java.lang.IllegalStateException", thrown["name"].asString())
    assertEquals("bad", thrown["message"].asString())
    val stackTrace = thrown["extendedStackTrace"].asString()
    assertTrue(stackTrace.startsWith("java.lang.IllegalStateException: bad"))
    assertTrue(stackTrace.contains("Caused by: java.lang.RuntimeException: cause"))
  }
}
