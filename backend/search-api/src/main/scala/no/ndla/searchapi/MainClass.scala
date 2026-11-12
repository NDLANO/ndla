/*
 * Part of NDLA search-api
 * Copyright (C) 2017 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.searchapi

import no.ndla.common.Warmup
import no.ndla.common.job.StandaloneJob
import no.ndla.network.tapir.NdlaTapirMain

class MainClass(override val props: SearchApiProperties) extends NdlaTapirMain[ComponentRegistry] {
  val componentRegistry = new ComponentRegistry(props)

  private def warmupRequest =
    (path: String, options: Map[String, String]) => Warmup.warmupRequest(props.ApplicationPort, path, options)

  override def warmup(): Unit = {
    warmupRequest("/search-api/v1/search", Map("query" -> "norge"))
    warmupRequest("/health", Map.empty)

    componentRegistry.healthController.setRunning()
  }

  override def beforeStart(): Unit = {}

  override def standaloneJobs: Seq[StandaloneJob] = Seq(componentRegistry.standaloneIndexing)
}
