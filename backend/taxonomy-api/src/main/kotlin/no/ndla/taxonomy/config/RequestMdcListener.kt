/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import jakarta.servlet.ServletRequestEvent
import jakarta.servlet.ServletRequestListener
import jakarta.servlet.http.HttpServletRequest
import java.util.UUID
import org.slf4j.MDC
import org.springframework.stereotype.Component

/**
 * Tomcat calls this before any filter and after it has logged an unhandled exception and forwarded
 * to the error page, so every log line for the request carries the request MDC.
 */
@Component
class RequestMdcListener : ServletRequestListener {
  override fun requestInitialized(event: ServletRequestEvent) {
    val request = event.servletRequest as? HttpServletRequest ?: return
    val correlationId =
        request.getHeader(CORRELATION_ID_HEADER)?.takeIf { it.isNotEmpty() }
            ?: UUID.randomUUID().toString()
    request.setAttribute(CORRELATION_ID_KEY, correlationId)
    MDC.put(CORRELATION_ID_KEY, correlationId)
    MDC.put("requestPath", request.requestURI + (request.queryString?.let { "?$it" } ?: ""))
    MDC.put("method", request.method)
  }

  override fun requestDestroyed(event: ServletRequestEvent) {
    MDC.clear()
  }

  companion object {
    const val CORRELATION_ID_KEY = "correlationID"
    const val CORRELATION_ID_HEADER = "X-Correlation-ID"
  }
}
