/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import jakarta.persistence.EntityManager
import no.ndla.taxonomy.integration.DraftApiClient
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.annotation.DirtiesContext
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.postgresql.PostgreSQLContainer

@Testcontainers
@DirtiesContext
abstract class AbstractIntegrationTest {

  @Autowired protected lateinit var entityManager: EntityManager

  // Mock draft-api-client to avoid filling log with errors
  @MockitoBean protected lateinit var draftApiClient: DraftApiClient

  protected fun checkSchemaExists(schemaName: String): Boolean {
    val result =
        entityManager
            .createNativeQuery(
                "SELECT schema_name FROM information_schema.schemata WHERE schema_name = '$schemaName'")
            .singleResult
    return result == schemaName
  }

  companion object {
    @Container @JvmField val postgresDB = PostgreSQLContainer("postgres:17.9")

    @DynamicPropertySource
    @JvmStatic
    fun properties(registry: DynamicPropertyRegistry) {
      registry.add("spring.datasource.url") { postgresDB.jdbcUrl }
      registry.add("spring.datasource.username") { postgresDB.username }
      registry.add("spring.datasource.password") { postgresDB.password }
      registry.add("spring.datasource.hikari.schema") { "taxonomy_api" }
    }
  }
}
