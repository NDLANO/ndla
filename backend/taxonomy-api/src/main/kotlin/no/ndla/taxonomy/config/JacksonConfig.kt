/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import no.ndla.taxonomy.domain.UpdateOrDelete
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.module.SimpleModule

@Configuration
class JacksonConfig {
  @Bean
  fun updateOrDeleteModule() =
      SimpleModule().apply {
        addDeserializer(UpdateOrDelete::class.java, UpdateOrDelete.Deserializer())
        addSerializer(UpdateOrDelete::class.java, UpdateOrDelete.Serializer())
      }
}
