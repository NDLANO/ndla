/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import com.fasterxml.jackson.datatype.jdk8.Jdk8Module
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.headers.Header
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.media.StringSchema
import io.swagger.v3.oas.models.parameters.HeaderParameter
import io.swagger.v3.oas.models.parameters.Parameter
import io.swagger.v3.oas.models.security.OAuthFlow
import io.swagger.v3.oas.models.security.OAuthFlows
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.servers.Server
import org.springdoc.core.customizers.OpenApiCustomizer
import org.springdoc.core.providers.ObjectMapperProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfiguration {

  @Value("\${auth0.issuer}") private lateinit var issuer: String

  @Value("\${ndla.environment:}") private lateinit var environment: String

  @Value("\${contact.name:NDLA}") private lateinit var contactName: String

  @Value("\${contact.email:hjelp+api@ndla.no}") private lateinit var contactEmail: String

  @Value("\${contact.url:https://ndla.no}") private lateinit var contactUrl: String

  @Value("\${terms.url:https://om.ndla.no/tos}") private lateinit var termsUrl: String

  @Bean
  fun API(objectMapperProvider: ObjectMapperProvider): OpenAPI {
    // Need this to support Java 8 types like Optional<> for request parameters
    objectMapperProvider.jsonMapper().registerModule(Jdk8Module())
    return OpenAPI()
        .components(components())
        .servers(servers())
        .info(
            Info()
                .title("NDLA Taxonomy API")
                .description(
                    """
                    Rest service and graph database for organizing content.

                    When you remove an entity, its associations are also deleted. E.g., if you remove a subject, its associations to any topics are removed. The topics themselves are not affected."""
                        .trimIndent())
                .version("v1")
                .contact(Contact().name(contactName).email(contactEmail).url(contactUrl))
                .termsOfService(termsUrl)
                .license(
                    License().name("GPL 3.0").url("https://www.gnu.org/licenses/gpl-3.0.en.html")))
  }

  private fun servers(): List<Server> {
    val url =
        when (environment) {
          "local" -> "http://api-gateway.ndla-local/taxonomy"
          "prod" -> "https://api.ndla.no/taxonomy"
          "test",
          "staging" -> String.format("https://api.%s.ndla.no/taxonomy", environment)
          else -> "/"
        }
    return listOf(Server().url(url))
  }

  private fun components(): Components {
    val implicit =
        SecurityScheme()
            .type(SecurityScheme.Type.OAUTH2)
            .flows(OAuthFlows().implicit(OAuthFlow().authorizationUrl(issuer + "authorize")))
    val header: Parameter =
        HeaderParameter().`in`("header").schema(StringSchema()).name("versionHash")
    val version = Header().description("versionHash").schema(StringSchema())
    return Components()
        .securitySchemes(mapOf("oauth" to implicit))
        .addParameters("versionHash", header)
        .addHeaders("versionHash", version)
  }

  @Bean
  fun headerParameterOpenAPICustomiser(): OpenApiCustomizer = OpenApiCustomizer { openApi ->
    openApi.paths.values
        .flatMap { pathItem -> pathItem.readOperations() }
        .forEach { operation ->
          operation.addParametersItem(
              HeaderParameter().`$ref`("#/components/parameters/versionHash"))
        }
  }
}
