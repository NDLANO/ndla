/*
 * Part of NDLA database
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.implicits.toOption
import no.ndla.common.logging.logTaskTime
import org.flywaydb.core.Flyway
import org.flywaydb.core.api.configuration.ClassicConfiguration
import org.flywaydb.core.api.migration.JavaMigration
import org.flywaydb.core.api.output.MigrateResult

import scala.jdk.CollectionConverters.*

case class DBMigrator(migrations: JavaMigration*)(using dataSource: DataSource, props: DatabaseProps)
    extends StrictLogging {
  private def logMigrationResult(result: MigrateResult): Unit = {
    logger.info(s"Num database migrations executed: ${result.migrationsExecuted}")
    val warnings = result.warnings.toOption.map(_.asScala).getOrElse(Nil)
    if (warnings.nonEmpty) {
      logger.info(s"With warnings: \n${warnings.mkString("\n")}")
    }
    result
      .migrations
      .toOption
      .toList
      .flatMap(_.asScala)
      .foreach { mo =>
        logger.info(
          s"Executed ${mo.`type`} migration: ${mo.category} ${mo.version} '${mo.description}' in ${mo.executionTime} ms"
        )
      }
  }

  def migrate(): Unit = logTaskTime("database migration", logTaskStart = true) {
    dataSource.connectToDatabase()

    val config = new ClassicConfiguration()
    config.setJavaMigrations(migrations*)
    config.setLocationsAsStrings(props.MetaMigrationLocation)
    config.setDataSource(dataSource)
    config.setSchemas(Array(props.MetaSchema))
    props.MetaMigrationTable.foreach(config.setTable)

    val flyway = new Flyway(config)

    val migrateResult = flyway.migrate()
    migrateResult.toOption.foreach(logMigrationResult)
  }
}
