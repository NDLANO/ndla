/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import javax.sql.DataSource
import no.ndla.taxonomy.service.VersionConnectionProvider
import no.ndla.taxonomy.service.VersionIdentifierResolver
import org.hibernate.boot.model.naming.Identifier
import org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl
import org.hibernate.cfg.AvailableSettings
import org.hibernate.cfg.Environment
import org.springframework.boot.jpa.autoconfigure.JpaProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.orm.jpa.JpaVendorAdapter
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean

/** Custom hibernate config to support multi tenancy setup */
@Configuration
class HibernateConfig(private val jpaProperties: JpaProperties) {

  @Bean
  @Primary
  fun entityManagerFactory(
      dataSource: DataSource,
      jpaVendorAdapter: JpaVendorAdapter,
      versionConnectionProvider: VersionConnectionProvider,
      versionIdentifierResolver: VersionIdentifierResolver,
  ): LocalContainerEntityManagerFactoryBean {
    val properties = HashMap<String, Any>(jpaProperties.properties)
    // Hibernate 7's snake case strategy skips quoted identifiers, and we quote all of them.
    properties[AvailableSettings.PHYSICAL_NAMING_STRATEGY] =
        object : PhysicalNamingStrategySnakeCaseImpl() {
          override fun quotedIdentifier(quotedName: Identifier): Identifier =
              Identifier.toIdentifier(unquotedIdentifier(quotedName).text, true)
        }
    properties[AvailableSettings.IMPLICIT_NAMING_STRATEGY] =
        "org.springframework.boot.hibernate.SpringImplicitNamingStrategy"
    properties[Environment.MULTI_TENANT_CONNECTION_PROVIDER] = versionConnectionProvider
    properties[Environment.MULTI_TENANT_IDENTIFIER_RESOLVER] = versionIdentifierResolver

    val em = LocalContainerEntityManagerFactoryBean()
    em.dataSource = dataSource
    em.setPackagesToScan("no.ndla.taxonomy")
    em.jpaVendorAdapter = jpaVendorAdapter
    em.setJpaPropertyMap(properties)
    return em
  }
}
