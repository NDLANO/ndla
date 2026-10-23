/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import no.ndla.taxonomy.service.VersionRequestInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class InterceptorConfig(
    private val tenantInterceptor: VersionRequestInterceptor,
    private val requestLoggerInterceptor: RequestLoggerInterceptor,
) : WebMvcConfigurer {

  override fun addInterceptors(registry: InterceptorRegistry) {
    registry.addInterceptor(requestLoggerInterceptor).addPathPatterns("/**")
    registry.addInterceptor(tenantInterceptor).addPathPatterns("/**")
  }
}
