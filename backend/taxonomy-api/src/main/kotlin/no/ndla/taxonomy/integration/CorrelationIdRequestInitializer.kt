/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.integration

import no.ndla.taxonomy.config.RequestMdcListener.Companion.CORRELATION_ID_HEADER
import no.ndla.taxonomy.config.RequestMdcListener.Companion.CORRELATION_ID_KEY
import org.slf4j.MDC
import org.springframework.http.client.ClientHttpRequest
import org.springframework.http.client.ClientHttpRequestInitializer

class CorrelationIdRequestInitializer : ClientHttpRequestInitializer {
  override fun initialize(request: ClientHttpRequest) {
    MDC.get(CORRELATION_ID_KEY)
        ?.takeIf { it.isNotEmpty() }
        ?.let { request.headers.set(CORRELATION_ID_HEADER, it) }
  }
}
