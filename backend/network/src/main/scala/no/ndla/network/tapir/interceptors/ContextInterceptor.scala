/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import no.ndla.common.configuration.Constants
import no.ndla.common.{CorrelationID, RequestLogger}
import no.ndla.network.TaxonomyData
import no.ndla.network.model.RequestInfo
import org.slf4j.MDC
import sttp.model.Header
import sttp.tapir.model.ServerRequest
import sttp.tapir.server.interceptor.RequestResult

object ContextInterceptor extends AroundRequestInterceptor {
  override def around[B](req: ServerRequest, next: ServerRequest => RequestResult[B]): RequestResult[B] = {
    val requestInfo = RequestInfo.fromRequest(req)
    requestInfo.setThreadContextRequestInfo()
    setBeforeMDC(requestInfo, req)
    try
      withCorrelationIdHeader(next(req))
    finally {
      RequestInfo.clear()
      MDC.clear()
    }
  }

  private def setBeforeMDC(info: RequestInfo, req: ServerRequest): Unit = {
    MDC.put("requestPath", RequestLogger.pathWithQueryParams(req))
    MDC.put("method", req.method.toString())

    if (info.taxonomyVersion != TaxonomyData.defaultVersion) {
      MDC.put("taxonomyVersion", info.taxonomyVersion): Unit
    }
  }

  private def withCorrelationIdHeader[B](result: RequestResult[B]): RequestResult[B] = {
    CorrelationID.get match {
      case None                => result
      case Some(correlationId) => result match {
          case RequestResult.Response(response, source) =>
            val header = Header(Constants.CorrelationIdHeader, correlationId)
            RequestResult.Response(response.addHeaders(List(header)), source)
          case other => other
        }
    }
  }
}
