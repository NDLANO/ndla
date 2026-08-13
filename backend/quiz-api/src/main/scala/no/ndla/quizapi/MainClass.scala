/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi

import no.ndla.common.Warmup
import no.ndla.network.tapir.NdlaTapirMain

class MainClass(override val props: QuizApiProperties) extends NdlaTapirMain[ComponentRegistry] {
  val componentRegistry = new ComponentRegistry(props)

  private def warmupRequest =
    (path: String, options: Map[String, String]) => Warmup.warmupRequest(props.ApplicationPort, path, options)

  override def warmup(): Unit = {
    warmupRequest("/health", Map.empty)
    componentRegistry.healthController.setRunning()
  }

  override def beforeStart(): Unit = {
    componentRegistry.migrator.migrate()
  }
}
