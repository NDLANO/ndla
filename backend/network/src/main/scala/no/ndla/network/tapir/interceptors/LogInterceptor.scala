/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.RequestLogger
import org.playframework.netty.http.StreamedHttpRequest
import org.slf4j.MDC
import sttp.model.HeaderNames.SensitiveHeaders
import sttp.model.{HeaderNames, MediaType}
import sttp.tapir.model.ServerRequest
import sttp.tapir.server.interceptor.RequestResult

object LogInterceptor extends AroundRequestInterceptor, StrictLogging {
  private val sensitiveHeaders = SensitiveHeaders + "feideauthorization"

  override def around[B](req: ServerRequest, next: ServerRequest => RequestResult[B]): RequestResult[B] =
    if (!shouldLogRequest(req)) next(req)
    else {
      logger.info(RequestLogger.beforeRequestLogString(req))
      val startTime = System.currentTimeMillis()

      val (loggedReq, bodyCapture) = req.underlying match {
        case sr: StreamedHttpRequest if isLoggableBody(req) =>
          val capture = RequestBodyCapture(req.contentLength)
          (req.withUnderlying(NettyStreamedRequestWrapper(sr, capture)), Some(capture))
        case _ => (req, None)
      }

      val result = next(loggedReq)
      logResult(loggedReq, result, System.currentTimeMillis() - startTime, bodyCapture)
      result
    }

  private def shouldLogRequest(req: ServerRequest): Boolean = {
    if (req.uri.path.size == 1) {
      if (req.uri.path.head == "metrics") return false
      if (req.uri.path.head == "health") return false
    } else if (req.uri.path.size > 1 && req.uri.path.head == "health") return false
    true
  }

  // Only log request body if Content-Type is suitable for logging
  private def isLoggableBody(req: ServerRequest): Boolean = req
    .contentType
    .flatMap(MediaType.parse(_).toOption)
    .exists {
      case MediaType("text", _, _, _)                                   => true
      case MediaType("application", "json", _, _)                       => true
      case MediaType("application", "xml", _, _)                        => true
      case MediaType("application", "x-www-form-urlencoded", _, _)      => true
      case MediaType("application", sub, _, _) if sub.endsWith("+json") => true
      case MediaType("application", sub, _, _) if sub.endsWith("+xml")  => true
      case _                                                            => false
    }

  private def addHeaderMDC(req: ServerRequest): Unit = req
    .headers
    .foreach { header =>
      val value =
        if (HeaderNames.isSensitive(header, sensitiveHeaders)) "[REDACTED]"
        else header.value
      MDC.put(s"requestHeader.${header.name.toLowerCase}", value)
    }

  private def logResult[B](
      req: ServerRequest,
      result: RequestResult[B],
      latency: Long,
      bodyCapture: Option[RequestBodyCapture],
  ): Unit = {
    val code: Int = result match {
      case RequestResult.Response(response, _) => response.code.code
      case RequestResult.Failure(failures)     => -1
    }

    if (code >= 400) {
      bodyCapture.foreach(capture => MDC.put("requestBody", capture.asString))
      addHeaderMDC(req)
    }

    MDC.put("reqLatencyMs", s"$latency")
    MDC.put("statusCode", code.toString)

    val s = RequestLogger.afterRequestLogString(
      method = req.method.toString(),
      requestPath = s"/${req.uri.path.mkString("/")}",
      queryString = req.queryParameters.toString(false),
      latency = latency,
      responseCode = code,
    )

    if (code >= 500) logger.error(s)
    else logger.info(s)
  }
}
