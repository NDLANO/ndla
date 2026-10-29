/*
 * Part of NDLA database
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import io.prometheus.metrics.core.metrics.{Counter, Histogram}
import no.ndla.common.implicits.toOption
import no.ndla.network.tapir.NdlaPrometheusRegistry
import scalikejdbc.GlobalSettings

object SqlMetrics {
  private val whitespace = "\\s+".r

  private def normalize(stmt: String): Option[String] = whitespace.replaceAllIn(stmt, " ").trim.toOption

  private val queriesTotal: Option[Counter] = Counter
    .builder()
    .toOption
    .flatMap(_.name("ndla_sql_queries_total").toOption)
    .flatMap(_.help("Successful SQL queries executed, by prepared statement.").toOption)
    .flatMap(_.labelNames("statement").toOption)
    .flatMap(_.register(NdlaPrometheusRegistry.registry).toOption)

  private val queryFailuresTotal: Option[Counter] = Counter
    .builder()
    .toOption
    .flatMap(_.name("ndla_sql_query_failures_total").toOption)
    .flatMap(_.help("Failed SQL queries, by prepared statement and exception class.").toOption)
    .flatMap(_.labelNames("statement", "exception").toOption)
    .flatMap(_.register(NdlaPrometheusRegistry.registry).toOption)

  private val queryDurationSeconds: Option[Histogram] = Histogram
    .builder()
    .toOption
    .flatMap(_.name("ndla_sql_query_duration_seconds").toOption)
    .flatMap(_.help("SQL query duration in seconds, by prepared statement (successful queries only).").toOption)
    .flatMap(_.labelNames("statement").toOption)
    .flatMap(_.classicUpperBounds(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0).toOption)
    .flatMap(_.register(NdlaPrometheusRegistry.registry).toOption)

  @volatile
  private var installed = false

  def install(): Unit = synchronized {
    if (installed) return
    GlobalSettings.taggedQueryCompletionListener = (stmt, _, millis, _) => {
      normalize(stmt).foreach { s =>
        queriesTotal.flatMap(_.labelValues(s).toOption).foreach(_.inc())
        queryDurationSeconds.flatMap(_.labelValues(s).toOption).foreach(_.observe(millis / 1000.0))
      }
    }
    GlobalSettings.queryFailureListener = (stmt, _, t) => {
      for {
        s         <- normalize(stmt)
        counter   <- queryFailuresTotal
        dataPoint <- counter.labelValues(s, t.getClass.getSimpleName).toOption
      } dataPoint.inc()
    }
    installed = true
  }
}
