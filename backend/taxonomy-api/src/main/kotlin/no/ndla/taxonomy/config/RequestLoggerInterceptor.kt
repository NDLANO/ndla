/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import no.ndla.taxonomy.config.RequestMdcListener.Companion.CORRELATION_ID_HEADER
import no.ndla.taxonomy.config.RequestMdcListener.Companion.CORRELATION_ID_KEY
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.stereotype.Component
import org.springframework.web.servlet.AsyncHandlerInterceptor

@Component
class RequestLoggerInterceptor : AsyncHandlerInterceptor {
  private val logger = LoggerFactory.getLogger(javaClass.name)

  override fun preHandle(
      request: HttpServletRequest,
      response: HttpServletResponse,
      handler: Any,
  ): Boolean {
    request.setAttribute(START_TIME, System.currentTimeMillis())
    // Echo the correlation id back so clients can quote it when reporting issues.
    (request.getAttribute(CORRELATION_ID_KEY) as? String)?.let {
      response.setHeader(CORRELATION_ID_HEADER, it)
    }
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
        request.getAttribute(CORRELATION_ID_KEY) ?: "",
        request.method,
        request.requestURI,
        request.queryString ?: "",
        request.getHeader("VersionHash") ?: "",
        latency.toString(),
        response.status,
    )
    MDC.remove("reqLatencyMs")
    super.afterCompletion(request, response, handler, ex)
  }

  companion object {
    private const val START_TIME = "startTime"
  }
}
