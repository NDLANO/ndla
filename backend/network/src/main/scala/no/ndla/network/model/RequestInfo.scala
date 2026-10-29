/*
 * Part of NDLA network
 * Copyright (C) 2018 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.model

import no.ndla.common.CorrelationID
import no.ndla.network.{ApplicationUrl, TaxonomyData}
import sttp.tapir.model.ServerRequest

/** Helper class to help keep Thread specific request information in futures. */
case class RequestInfo(correlationId: Option[String], taxonomyVersion: String, applicationUrl: Option[String]) {
  def setThreadContextRequestInfo(): Unit = {
    TaxonomyData.set(taxonomyVersion)
    CorrelationID.set(correlationId)
    applicationUrl match {
      case Some(url) => ApplicationUrl.set(url)
      case None      => ApplicationUrl.clear()
    }
  }
}

object RequestInfo {
  def fromRequest(request: ServerRequest): RequestInfo = {
    val ndlaRequest = NdlaHttpRequest.from(request)
    new RequestInfo(
      correlationId = Some(CorrelationID.fromRequest(request)),
      taxonomyVersion = TaxonomyData.fromRequest(ndlaRequest),
      applicationUrl = Some(ApplicationUrl.fromRequest(ndlaRequest)),
    )
  }

  def fromThreadContext(): RequestInfo = {
    val correlationId   = CorrelationID.get
    val taxonomyVersion = TaxonomyData.get
    val applicationUrl  = ApplicationUrl.get

    new RequestInfo(correlationId, taxonomyVersion, applicationUrl)
  }

  def clear(): Unit = {
    TaxonomyData.clear()
    CorrelationID.clear()
    ApplicationUrl.clear()
  }

}
