/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import ch.qos.logback.classic.pattern.ThrowableProxyConverter
import ch.qos.logback.classic.spi.ILoggingEvent
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import org.springframework.boot.json.JsonWriter
import org.springframework.boot.logging.structured.StructuredLogFormatter

/**
 * Mirrors the field names of the log4j2 `JsonLayout` used by the Scala backends (see
 * `backend/log4j/main/log4j2.yaml`), so logs can be queried and correlated the same way across
 * applications.
 */
class JsonLogFormatter(private val throwableProxyConverter: ThrowableProxyConverter) :
    StructuredLogFormatter<ILoggingEvent> {
  private val writer = JsonWriter.standard<Map<String, Any?>>().withNewLineAtEnd()

  override fun format(event: ILoggingEvent): String = writer.writeToString(toMap(event))

  private fun toMap(event: ILoggingEvent): Map<String, Any?> = buildMap {
    val instant = event.instant
    val mdc = event.mdcPropertyMap.orEmpty()

    put("instant", mapOf("epochSecond" to instant.epochSecond, "nanoOfSecond" to instant.nano))
    put("thread", event.threadName)
    put("level", event.level.toString())
    put("loggerName", event.loggerName)
    put("message", event.formattedMessage)
    event.throwableProxy?.let {
      put(
          "thrown",
          mapOf(
              "name" to it.className,
              "message" to it.message,
              "extendedStackTrace" to throwableProxyConverter.convert(event),
          ),
      )
    }
    put("contextMap", mdc)
    event.callerData.firstOrNull()?.let {
      put(
          "source",
          mapOf(
              "class" to it.className,
              "method" to it.methodName,
              "file" to it.fileName,
              "line" to it.lineNumber,
          ),
      )
    }
    CORRELATION_KEYS.forEach { key -> mdc[key]?.takeIf { it.isNotEmpty() }?.let { put(key, it) } }
    put("timestamp", TIMESTAMP_FORMAT.format(instant))
  }

  companion object {
    private val CORRELATION_KEYS = listOf("correlationID", "trace_id", "span_id", "trace_flags")
    private val TIMESTAMP_FORMAT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC)
  }
}
