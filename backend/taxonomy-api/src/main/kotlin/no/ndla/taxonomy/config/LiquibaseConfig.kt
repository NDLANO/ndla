/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import java.sql.SQLException
import javax.sql.DataSource
import liquibase.exception.LiquibaseException
import liquibase.integration.spring.SpringLiquibase
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.InitializingBean
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.liquibase.autoconfigure.LiquibaseProperties
import org.springframework.context.ResourceLoaderAware
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ResourceLoader

@Configuration
class LiquibaseConfig(
    private val dataSource: DataSource,
    private val liquibaseProperties: LiquibaseProperties,
) : InitializingBean, ResourceLoaderAware {
  private val logger = LoggerFactory.getLogger(javaClass)

  @Value("\${spring.datasource.hikari.schema:taxonomy_api}")
  private lateinit var defaultSchema: String

  @Value("\${spring.datasource.url:}") private lateinit var dataSourceUrl: String

  @Value("\${spring.datasource.username:}") private lateinit var dataSourceUsername: String

  @Value("\${spring.datasource.password:}") private lateinit var dataSourcePassword: String

  private lateinit var resourceLoader: ResourceLoader

  override fun afterPropertiesSet() {
    try {
      val schemas = ArrayList<String>()
      val resultSet =
          dataSource.connection.prepareStatement("SELECT hash FROM version").executeQuery()
      while (resultSet.next()) {
        schemas.add(String.format("%s_%s", defaultSchema, resultSet.getString(1)))
      }
      this.runOnAllSchemas(dataSource, schemas)
    } catch (exception: Exception) {
      if (exception !is SQLException && exception !is LiquibaseException) throw exception
      // No version table
      logger.info(
          "Failed to find version table in database. Does not run migration on alternative schemas",
          exception,
      )
    }
  }

  protected fun runOnAllSchemas(dataSource: DataSource, schemas: Collection<String>) {
    for (schema in schemas) {
      logger.info("Initializing Liquibase for version $schema")

      // TODO: There is probably a better way to do this.
      var ds = dataSource
      if (dataSourceUsername != "") {
        val hc = HikariConfig()
        hc.maximumPoolSize = 1
        hc.schema = schema
        hc.username = dataSourceUsername
        hc.password = dataSourcePassword
        hc.jdbcUrl = dataSourceUrl
        ds = HikariDataSource(hc)
      }

      val liquibase = this.getSpringLiquibase(ds, schema)
      liquibase.afterPropertiesSet()
      logger.info("Liquibase ran for version $schema")
    }
  }

  protected fun getSpringLiquibase(dataSource: DataSource, schema: String): SpringLiquibase {
    val liquibase = SpringLiquibase()
    liquibase.resourceLoader = getResourceLoader()
    liquibase.dataSource = dataSource
    liquibase.defaultSchema = schema
    liquibase.liquibaseSchema = schema
    liquibase.setChangeLogParameters(mapOf("schema" to schema))
    liquibase.changeLog = liquibaseProperties.changeLog
    return liquibase
  }

  fun getResourceLoader(): ResourceLoader = resourceLoader

  override fun setResourceLoader(resourceLoader: ResourceLoader) {
    this.resourceLoader = resourceLoader
  }
}
