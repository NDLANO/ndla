/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.stereotype.Component
import org.springframework.web.servlet.AsyncHandlerInterceptor

@Component
class RequestLoggerInterceptor : AsyncHandlerInterceptor {
  private val logger = LoggerFactory.getLogger(javaClass.name)

  fun getCorrelationId(request: HttpServletRequest): String =
      request.getHeader("X-Correlation-ID") ?: ""

  override fun preHandle(
      request: HttpServletRequest,
      response: HttpServletResponse,
      handler: Any,
  ): Boolean {
    request.setAttribute(START_TIME, System.currentTimeMillis())
    val correlationId = getCorrelationId(request)
    MDC.put("correlationID", correlationId)
    // Echo the correlation id back so clients can quote it when reporting issues.
    response.setHeader("X-Correlation-ID", correlationId)
    val requestPath = request.requestURI
    val queryString = request.queryString ?: ""
    val pathAndQuery = requestPath + (if (queryString.isEmpty()) "" else "?$queryString")
    MDC.put("requestPath", pathAndQuery)
    MDC.put("method", request.method)
    return true
  }

  override fun afterCompletion(
      request: HttpServletRequest,
      response: HttpServletResponse,
      handler: Any,
      ex: Exception?,
  ) {
    val startTime = request.getAttribute(START_TIME) as Long
    val latency = System.currentTimeMillis() - startTime
    MDC.put("reqLatencyMs", latency.toString())
    logger.info(
        "({}) {} {}?{} ({}) executed in {}ms with code {}",
        request.getHeader("X-Correlation-ID") ?: "",
        request.method,
        request.requestURI,
        request.queryString ?: "",
        request.getHeader("VersionHash") ?: "",
        latency.toString(),
        response.status,
    )
    // Spring reuses worker threads, so clear MDC to avoid leaking context into the next request.
    MDC.remove("correlationID")
    MDC.remove("requestPath")
    MDC.remove("method")
    MDC.remove("reqLatencyMs")
    super.afterCompletion(request, response, handler, ex)
  }

  companion object {
    private const val START_TIME = "startTime"
  }
}
