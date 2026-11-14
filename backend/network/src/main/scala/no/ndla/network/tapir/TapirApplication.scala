/*
 * Part of NDLA network
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import no.ndla.common.configuration.BaseProps
import no.ndla.common.job.StandaloneJob

trait TapirApplication[PropType <: BaseProps] {
  given props: PropType
  given ndlaServer: NdlaServer
  given swagger: SwaggerController
  given healthController: TapirHealthController

  /** Jobs that can be run instead of the server, see [[StandaloneJob]]. Add a [[StandaloneJobController]] to also let
    * them be triggered in the running server.
    */
  implicit lazy val standaloneJobs: Seq[StandaloneJob] = Seq.empty
}
