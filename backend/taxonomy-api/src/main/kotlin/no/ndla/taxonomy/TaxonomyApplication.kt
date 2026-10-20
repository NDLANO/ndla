/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.file.Files
import java.nio.file.Path
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration
import org.springframework.boot.web.server.context.WebServerApplicationContext

@SpringBootApplication(exclude = [UserDetailsServiceAutoConfiguration::class])
class TaxonomyApplication {
  companion object {
    @JvmStatic
    fun main(args: Array<String>) {
      if (args.contains("--generate-openapi")) {
        generateOpenApi()
        return
      }
      SpringApplication.run(TaxonomyApplication::class.java, *args)
    }

    private val OPENAPI_PROPERTIES =
        arrayOf(
            "--spring.profiles.active=typescript",
            "--server.port=0",
            "--management.server.port=0",
            "--ndla.environment=",
            "--auth0.issuer=https://ndla.eu.auth0.com/",
        )

    private fun generateOpenApi() {
      val app = SpringApplication(TaxonomyApplication::class.java)
      app.run(*OPENAPI_PROPERTIES).use { ctx ->
        val port = (ctx as WebServerApplicationContext).webServer!!.port
        val client = HttpClient.newHttpClient()
        val req =
            HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:$port/api-docs"))
                .GET()
                .build()
        val resp = client.send(req, HttpResponse.BodyHandlers.ofString())
        if (resp.statusCode() != 200) {
          throw RuntimeException("Failed to fetch OpenAPI spec: HTTP " + resp.statusCode())
        }
        Files.writeString(Path.of("taxonomy-api.json"), resp.body())
      }
    }
  }
}
